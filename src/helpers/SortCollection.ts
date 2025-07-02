export const sortBytitleBrandDateDesc = (data: any[]) => {
    return [...data].sort((a, b) => new Date(b.titleBrandDate).getTime() - new Date(a.titleBrandDate).getTime());
};

// // export const sortBytitleBrandDateDesc = (data: any[]) => {
// //     return [...data].sort((a, b) => a.idSequence - b.idSequence);
// // };
// export const sortBytitleBrandDateDesc = (data:any) => {
//     return [...data].sort((a, b) => b.idSequence - a.idSequence);
// };

export const getLatesttitleBrandDate = (data: any) => {
    const vinMap = new Map();
    data.forEach((item: any) => {
        const existing = vinMap.get(item.vin);
        if (!existing || new Date(item.titleBrandDate) > new Date(existing.titleBrandDate)) {
            vinMap.set(item.vin, item);
        }
    });

    return Array.from(vinMap.values());
};

export const categorizeDataSIngleSearch = (data: any) => {
    const result: any = {
        brandDataCount: 0,
        titleDataCount: 0,
        JSICount: 0,
        brandData: [],
        titleData: [],
        JSI: [],
        uniqueBrand: []
    };

    data.forEach((item: any) => {
        switch (item?.alertType) {
            case "Brand":
                result.brandData.push(item);
                result.brandDataCount++;
                break;
            case "Title":
                result.titleData.push(item);
                result.titleDataCount++;
                break;
            case "JSI":
                result.JSI.push(item);
                result.JSICount++;
                break;
        }
    });

    // Create uniqueBrand array by filtering out duplicates based on the brand text
    const seenBrands = new Set();
    result.uniqueBrand = result.brandData.filter((item: any) => {
        const brandName = item?.brand?.split(' - ')[0]?.trim(); // or just item.brand if you want full string
        if (!seenBrands.has(brandName)) {
            seenBrands.add(brandName);
            return true;
        }
        return false;
    });

    return result;
};
