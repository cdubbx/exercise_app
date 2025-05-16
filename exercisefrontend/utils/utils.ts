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

export const convertToDecimalFeet = (feet:number, inches: number): number => {
    console.log(feet + inches / 12);
    return feet + inches / 12;
}

export const formatDecimalFeet = (decimalHeight:number) => {
    const feet = Math.floor(decimalHeight);
    const inches = Math.round((decimalHeight - feet) * 12);
    return `${feet}'${inches}"`
}

export const formatWeight = (dirtyWeight: number | undefined) => {
    if (dirtyWeight === undefined || isNaN(dirtyWeight)) return "Invalid weight";
    return Number(dirtyWeight.toPrecision(4));
  };

export const getImageUrl = (url: string) => {
  return url.replace("github.com", "raw.githubusercontent.com").replace("/blob", "");
};
