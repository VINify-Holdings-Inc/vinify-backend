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