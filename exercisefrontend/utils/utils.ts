export const formatDate = (dateObj: string | Date, formatType: "full" | "mm-dd-yy" | "mm-yy"): string => {
    if(!dateObj) return 'Invalid date';
    const date = typeof dateObj === "string" ? new Date(dateObj): dateObj
    if (isNaN(date.getTime())) return "Invalid date";
    switch(formatType){
        case "full":
            return date.toLocaleDateString('en-US', {year: "numeric", month:'long'})
        case "mm-dd-yy":
            return date.toLocaleDateString('en-US', {year:'2-digit', month:'2-digit', day:'2-digit'})
        case 'mm-yy':
            return date.toLocaleDateString('en-US', {year:'2-digit', month:'2-digit'})
        default:
            return "Invalid Format"
    }
}

export const determineStreakIcon = () => {
    
}
