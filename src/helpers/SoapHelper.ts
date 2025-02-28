export const  transformVehicleDataToJson = (data: any) => {
    if (!data || !data.VehicleDesignationAbstract || !Array.isArray(data.VehicleDesignationAbstract)) {
      return [];
    }
  
    return data.VehicleDesignationAbstract.map((item: any) => {
      return {
        vin: data.VehicleIdentification?.IdentificationID || null,
        titleBrandDate: item?.VehicleBrandDate?.Date || null,
        brand: item?.VehicleBrandCode ? item.VehicleBrandCode.replace(/^0/, "") : null,  
        ReportingEntityCategoryCode: item?.ReportingEntityAbstract?.ReportingEntityCategoryCode || null,
        IdentificationID: item?.ReportingEntityAbstract?.IdentificationID?.trim() || null,
        ReportingEntityCategoryText: item?.ReportingEntityAbstract?.ReportingEntityCategoryText || null,
        EntityName: item?.ReportingEntityAbstract?.EntityName?.trim() || null,
      };
    });
  };
  