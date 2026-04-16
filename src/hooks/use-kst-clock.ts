import { useEffect, useState } from 'react'

const formatKst = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)

export const useKstClock = () => {
  const [time, setTime] = useState(() => formatKst(new Date()))
  useEffect(() => {
    const id = setInterval(() => setTime(formatKst(new Date())), 30_000)
    return () => clearInterval(id)
  }, [])
  return time
}
