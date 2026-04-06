'use client'

import React from 'react'
import Image from 'next/image'

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number
  tag?: string
  listType?: string
  url?: string
  fields?: { 
    url?: string
    newTab?: boolean
    blockType?: string
    videoUrl?: string
    [key: string]: any
  }
  value?: any
  relationTo?: string
  id?: string
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
      const tag = node.tag || 'h2'
      if (tag === 'h1') return <h1 key={index}>{children}</h1>
      if (tag === 'h2') return <h2 key={index}>{children}</h2>
      if (tag === 'h3') return <h3 key={index}>{children}</h3>
      if (tag === 'h4') return <h4 key={index}>{children}</h4>
      if (tag === 'h5') return <h5 key={index}>{children}</h5>
      return <h6 key={index}>{children}</h6>
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
    case 'upload':
      // Image/Video upload from Payload
      const media = typeof node.value === 'object' && node.value !== null ? node.value : null
      
      if (media?.url) {
        const isVideo = media.mimeType?.startsWith('video/')
        
        if (isVideo) {
          // Render video
          return (
            <div key={index} className="richtext-video">
              <video controls width="100%" style={{ maxWidth: '100%' }}>
                <source src={media.url} type={media.mimeType} />
                Ваш браузер не поддерживает видео.
              </video>
              {media.caption && (
                <p className="richtext-image-caption">{media.caption}</p>
              )}
            </div>
          )
        }
        
        // Render image
        return (
          <div key={index} className="richtext-image">
            <Image
              src={media.url}
              alt={media.alt || media.filename || ''}
              width={media.width || 800}
              height={media.height || 600}
              style={{ width: '100%', height: 'auto' }}
            />
            {media.caption && (
              <p className="richtext-image-caption">{media.caption}</p>
            )}
          </div>
        )
      }
      
      // Fallback: if value is just an ID, we can't render it without fetching
      // This shouldn't happen if depth is set correctly in the API
      console.warn('Upload node has no populated media data:', node)
      return null
    case 'block':
      // Video or other block types
      if (node.fields?.blockType === 'video') {
        const videoUrl = node.fields?.videoUrl || node.fields?.url
        if (videoUrl) {
          // Check if it's a YouTube/Vimeo embed
          if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com')) {
            return (
              <div key={index} className="richtext-video">
                <iframe
                  src={videoUrl}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )
          }
          // Regular video file
          return (
            <div key={index} className="richtext-video">
              <video controls width="100%" style={{ maxWidth: '100%' }}>
                <source src={videoUrl} />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          )
        }
      }
      return null
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
