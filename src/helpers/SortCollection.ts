export const sortByalertDateDesc = (data: any[]) => {
    return [...data].sort((a, b) => new Date(b.alertDate).getTime() - new Date(a.alertDate).getTime());
};


export const getLatestalertDate=(data:any)=> {
    const vinMap = new Map(); 
    data.forEach((item:any) => {
      const existing = vinMap.get(item.vin);
      if (!existing || new Date(item.alertDate) > new Date(existing.alertDate)) {
        vinMap.set(item.vin, item);
      }
    });
  
    return Array.from(vinMap.values());
  } 