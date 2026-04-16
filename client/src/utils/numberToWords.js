export const numberToWords = (num) => {
    if (isNaN(num) || num === 0) return "Zero Rupees Only";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const convertInt = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convertInt(n % 100) : "");
        if (n < 100000) return convertInt(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convertInt(n % 1000) : "");
        if (n < 10000000) return convertInt(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convertInt(n % 100000) : "");
        return convertInt(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convertInt(n % 10000000) : "");
    };

    const parts = Number(num).toFixed(2).split(".");
    const rupees = parseInt(parts[0], 10);
    const paise = parseInt(parts[1], 10);

    let text = convertInt(rupees) + " Rupees";
    if (paise > 0) text += " and " + convertInt(paise) + " Paise";
    return text + " Only";
};