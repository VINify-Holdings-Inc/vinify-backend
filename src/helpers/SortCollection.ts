export const sortBytitleBrandDateDesc = (data: any[]) => {
    return [...data].sort((a, b) => new Date(b.titleBrandDate).getTime() - new Date(a.titleBrandDate).getTime());
};


export const getLatesttitleBrandDate=(data:any)=> {
    const vinMap = new Map(); 
    data.forEach((item:any) => {
      const existing = vinMap.get(item.vin);
      if (!existing || new Date(item.titleBrandDate) > new Date(existing.titleBrandDate)) {
        vinMap.set(item.vin, item);
      }
    });
  
    return Array.from(vinMap.values());
  } 

export const  categorizeDataSIngleSearch=(data:any)=> {
    const result :any= {
        brandDataCount: 0,
        titleDataCount: 0,
        JSICount: 0,
        brandData: [],
        titleData: [],
        JSI: []
    };

    data.forEach((item:any) => {
        switch (item?.ReportingEntityCategoryCode) {
            case "S":
                result?.brandData?.push(item);
                result.brandDataCount++;
                break;
            case "I":
                result?.titleData?.push(item);
                result.titleDataCount++;
                break;
            case "J":
                result?.JSI?.push(item);
                result.JSICount++;
                break;
        }
    });

    return result;
}