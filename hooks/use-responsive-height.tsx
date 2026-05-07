'use client'

import { useState, useEffect } from 'react'

export function useResponsiveHeight(defaultHeight = 300, mobileHeight = 220): number {
  const [height, setHeight] = useState(defaultHeight)

  useEffect(() => {
    const update = () => setHeight(window.innerWidth < 640 ? mobileHeight : defaultHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [defaultHeight, mobileHeight])

  return height
}

export function useResponsiveOuterRadius(defaultRadius = 100, mobileRadius = 70): number {
  const [radius, setRadius] = useState(defaultRadius)

  useEffect(() => {
    const update = () => setRadius(window.innerWidth < 640 ? mobileRadius : defaultRadius)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [defaultRadius, mobileRadius])

  return radius
}

export function useResponsiveFontSize(defaultSize = 12, mobileSize = 10): number {
  const [size, setSize] = useState(defaultSize)

  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? mobileSize : defaultSize)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [defaultSize, mobileSize])

  return size
}

export function useResponsiveMargin(
  defaultMargin = { top: 5, right: 30, left: 20, bottom: 5 },
  mobileMargin = { top: 5, right: 10, left: 0, bottom: 5 }
) {
  const [margin, setMargin] = useState(defaultMargin)

  useEffect(() => {
    const update = () => setMargin(window.innerWidth < 640 ? mobileMargin : defaultMargin)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return margin
}

export function useResponsiveYAxisWidth(defaultWidth = 60, mobileWidth = 40): number {
  const [width, setWidth] = useState(defaultWidth)

  useEffect(() => {
    const update = () => setWidth(window.innerWidth < 640 ? mobileWidth : defaultWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [defaultWidth, mobileWidth])

  return width
}
