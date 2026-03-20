'use client'

import React from 'react'

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number
  tag?: string
  listType?: string
  url?: string
  fields?: { url?: string; newTab?: boolean }
}

interface LexicalRoot {
  root?: {
    children?: LexicalNode[]
  }
}

function renderNode(node: LexicalNode, index: number): React.ReactNode {
  if (node.type === 'text') {
    let content: React.ReactNode = node.text || ''
    // format: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code
    if (node.format) {
      if (node.format & 1) content = <strong key={index}>{content}</strong>
      if (node.format & 2) content = <em key={index}>{content}</em>
      if (node.format & 16) content = <code key={index}>{content}</code>
    }
    return content
  }

  const children = node.children?.map((child, i) => renderNode(child, i))

  switch (node.type) {
    case 'paragraph':
      return <p key={index}>{children}</p>
    case 'heading':
      const Tag = (node.tag || 'h2') as keyof JSX.IntrinsicElements
      return <Tag key={index}>{children}</Tag>
    case 'list':
      return node.listType === 'number' 
        ? <ol key={index}>{children}</ol>
        : <ul key={index}>{children}</ul>
    case 'listitem':
      return <li key={index}>{children}</li>
    case 'link':
      const url = node.fields?.url || node.url || '#'
      const newTab = node.fields?.newTab
      return (
        <a key={index} href={url} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      )
    case 'quote':
      return <blockquote key={index}>{children}</blockquote>
    case 'linebreak':
      return <br key={index} />
    default:
      return children ? <>{children}</> : null
  }
}

interface Props {
  content: LexicalRoot | null | undefined
  className?: string
}

export function RichText({ content, className }: Props) {
  if (!content?.root?.children?.length) {
    return null
  }

  return (
    <div className={`richtext ${className || ''}`}>
      {content.root.children.map((node, i) => renderNode(node, i))}
    </div>
  )
}
