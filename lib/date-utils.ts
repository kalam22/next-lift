/**
 * Format date to WITA (UTC+8) timezone
 * @param dateString - ISO date string
 * @param isUpdatedAt - If true, converts UTC to UTC+8. If false, uses local time directly
 * @returns Formatted date string in format "DD Bulan YYYY, HH:MM" or "-" if invalid
 */
export function formatWITA(dateString: string, isUpdatedAt: boolean = false): string {
    if (!dateString) return '-'
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    
    if (isUpdatedAt) {
        // For updatedAt: parse as UTC and add 8 hours to convert to UTC+8
        let dateStr = dateString
        if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
            dateStr = dateStr.replace(' ', 'T') + 'Z'
        }
        
        const date = new Date(dateStr)
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '-'
        }
        
        // Get UTC components (database stores in UTC)
        const utcYear = date.getUTCFullYear()
        const utcMonth = date.getUTCMonth()
        const utcDay = date.getUTCDate()
        const utcHour = date.getUTCHours()
        const utcMinute = date.getUTCMinutes()
        
        // Add 8 hours to convert UTC to UTC+8 (WITA)
        let witaHour = utcHour + 8
        let witaDay = utcDay
        let witaMonth = utcMonth
        let witaYear = utcYear
        
        // Handle hour overflow (if hour >= 24, move to next day)
        if (witaHour >= 24) {
            witaHour = witaHour - 24
            witaDay = witaDay + 1
        }
        
        // Handle day overflow
        const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getDate()
        if (witaDay > daysInMonth) {
            witaDay = 1
            witaMonth = witaMonth + 1
        }
        
        // Handle month overflow
        if (witaMonth >= 12) {
            witaMonth = 0
            witaYear = witaYear + 1
        }
        
        return `${String(witaDay).padStart(2, '0')} ${monthNames[witaMonth]} ${witaYear}, ${String(witaHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')}`
    } else {
        // For createdAt: use local time directly (already correct)
        const date = new Date(dateString)
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '-'
        }
        
        const day = String(date.getDate()).padStart(2, '0')
        const month = monthNames[date.getMonth()]
        const year = date.getFullYear()
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        
        return `${day} ${month} ${year}, ${hour}:${minute}`
    }
}

