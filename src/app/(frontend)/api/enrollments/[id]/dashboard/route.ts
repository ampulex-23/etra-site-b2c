import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/enrollments/[id]/dashboard
 * Returns full dashboard data: enrollment, cohort, infoproduct, days, modules, progress.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config })

    // Get enrollment with deep population
    const enrollment = await (payload as any).findByID({
      collection: 'enrollments',
      id,
      depth: 3,
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    const cohort =
      typeof enrollment.cohort === 'object' ? enrollment.cohort : null
    const infoproduct =
      cohort && typeof cohort.infoproduct === 'object'
        ? cohort.infoproduct
        : null

    if (!cohort || !infoproduct) {
      return NextResponse.json(
        { error: 'Данные курса не найдены' },
        { status: 404 },
      )
    }

    // Get course days
    const days = await (payload as any).find({
      collection: 'course-days',
      where: { cohort: { equals: cohort.id } },
      sort: 'dayNumber',
      limit: 500,
      depth: 0,
    })

    // Get modules
    const modules = await (payload as any).find({
      collection: 'course-modules',
      where: {
        infoproduct: { equals: infoproduct.id },
        visible: { equals: true },
      },
      sort: 'order',
      limit: 50,
      depth: 0,
    })

    // Get reports for this enrollment
    const reports = await (payload as any).find({
      collection: 'participant-reports',
      where: { enrollment: { equals: id } },
      sort: '-date',
      limit: 500,
      depth: 0,
    })

    // Get chat rooms for this cohort
    const chatRooms = await (payload as any).find({
      collection: 'chat-rooms',
      where: {
        cohort: { equals: cohort.id },
        isActive: { equals: true },
      },
      sort: 'createdAt',
      limit: 10,
      depth: 0,
    })

    // Find today's day
    const todayStr = new Date().toISOString().split('T')[0]
    const todayDay = days.docs.find(
      (d: any) => d.date && d.date.split('T')[0] === todayStr,
    )

    // Find today's report
    const todayReport = reports.docs.find(
      (r: any) => r.date && r.date.split('T')[0] === todayStr,
    )

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        hashtag: enrollment.hashtag,
        currentDay: enrollment.currentDay,
        reportStreak: enrollment.reportStreak,
        missedReports: enrollment.missedReports,
        enrolledAt: enrollment.enrolledAt,
      },
      infoproduct: {
        id: infoproduct.id,
        title: infoproduct.title,
        slug: infoproduct.slug,
        type: infoproduct.type,
        durationDays: infoproduct.durationDays,
        coverImage: infoproduct.coverImage?.url || null,
        reportTemplate: infoproduct.reportTemplate || [],
        reportRules: infoproduct.reportRules || {},
        scheduleMorning: infoproduct.scheduleMorning,
        scheduleDay: infoproduct.scheduleDay,
        scheduleEvening: infoproduct.scheduleEvening,
        dietRecommendations: infoproduct.dietRecommendations,
        contraindications: infoproduct.contraindications,
        rules: infoproduct.rules,
        team: (infoproduct.team || []).map((t: any) => ({
          name: t.name,
          role: t.role,
          avatar: t.avatar?.url || null,
        })),
      },
      cohort: {
        id: cohort.id,
        title: cohort.title,
        status: cohort.status,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
      },
      days: days.docs.map((d: any) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        date: d.date,
        title: d.title,
        morningBlock: d.morningBlock,
        dayBlock: d.dayBlock,
        eveningBlock: d.eveningBlock,
        specialNotes: d.specialNotes,
        broadcast: d.broadcast || null,
        sportProgram: d.sportProgram,
      })),
      modules: modules.docs.map((m: any) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        type: m.type,
        icon: m.icon,
        description: m.description,
        content: m.content,
      })),
      reports: reports.docs.map((r: any) => ({
        id: r.id,
        date: r.date,
        items: r.items || [],
        completionRate: r.completionRate,
        notes: r.notes,
        status: r.status,
        submittedAt: r.submittedAt,
        courseDay: r.courseDay,
      })),
      chatRooms: chatRooms.docs.map((c: any) => ({
        id: c.id,
        title: c.title,
        type: c.type,
      })),
      todayDay: todayDay
        ? {
            id: todayDay.id,
            dayNumber: todayDay.dayNumber,
            title: todayDay.title,
            morningBlock: todayDay.morningBlock,
            dayBlock: todayDay.dayBlock,
            eveningBlock: todayDay.eveningBlock,
            specialNotes: todayDay.specialNotes,
            broadcast: todayDay.broadcast || null,
            sportProgram: todayDay.sportProgram,
          }
        : null,
      todayReport: todayReport || null,
    })
  } catch (error: any) {
    console.error('[api/enrollments/dashboard] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
