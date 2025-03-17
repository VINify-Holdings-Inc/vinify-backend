export const transformVehicleDataToJson = (data: any) => {
  const result: any[] = [];
  
  if (!data?.VehicleDesignationAbstract || !Array.isArray(data.VehicleDesignationAbstract)) {
    return [];
  }

  data.VehicleDesignationAbstract.forEach((item: any) => {
    if (item?.ReportingEntityAbstract?.ReportingEntityCategoryCode === "S") {
      const temp = {
        vin: data.VehicleIdentification?.IdentificationID || null,
        titleBrandDate: item?.VehicleBrandDate?.Date || null,
        brand: item?.VehicleBrandCode ? item.VehicleBrandCode.replace(/^0/, "") : null,
        ReportingEntityCategoryCode: item?.ReportingEntityAbstract?.ReportingEntityCategoryCode || null,
        IdentificationID: item?.ReportingEntityAbstract?.IdentificationID?.trim() || null,
        ReportingEntityCategoryText: item?.ReportingEntityAbstract?.ReportingEntityCategoryText || null,
        EntityName: item?.ReportingEntityAbstract?.EntityName?.trim() || null,
      };
      result.push(temp);
    } else {
      const temp = {
        vin: data.VehicleIdentification?.IdentificationID || null,
        titleBrandDate: item?.VehicleObtainedDate || null,
        ReportingEntityCategoryCode: item?.ReportingEntityAbstract?.ReportingEntityCategoryCode || null,
        IdentificationID: item?.ReportingEntityAbstract?.LocationStateUSPostalServiceCode?.trim() || null,
        ReportingEntityCategoryText: item?.ReportingEntityAbstract?.ReportingEntityCategoryText || null,
        EntityName: item?.ReportingEntityAbstract?.EntityName?.trim() || null,
        LocationCityName: item?.ReportingEntityAbstract?.LocationCityName?.trim() || null,
        TelephoneNumberFullID: item?.ReportingEntityAbstract?.TelephoneNumberFullID?.trim() || null,
        ContactEmailID: item?.ReportingEntityAbstract?.ContactEmailID?.trim() || null,
        VehicleIntendedForExportCode: item?.VehicleIntendedForExportCode?.trim() || null,
        VehicleDispositionText: item?.VehicleDispositionText?.trim() || null,
        export: item?.VehicleIntendedForExportCode === "N" ? "no" : "yes",
      };
      result.push(temp);
    }
  });

  return result;
};

export const transformVehicleDataToJsonTitle = (data: any) => {
  const result: any[] = [];

  const currentTitle = {
    vin: data.VehicleIdentification?.IdentificationID || null,
    titleBrandDate: data?.Title?.TitleIssueDate?.Date || null,
    IdentificationID: data?.Title?.TitleIssuingAuthorityName?.trim() || null,
    status: "Current",
    ReportingEntityCategoryCode: "T",
    VehicleOdometerReadingMeasure: data?.Title?.VehicleOdometerReadingMeasure || null,
    VehicleOdometerReadingUnitCode: data?.Title?.VehicleOdometerReadingUnitCode || null,
    RecordMatchSequenceID: data?.Title?.RecordMatchSequenceID || null,
  };

  result.push(currentTitle);

  if (!data?.Title?.HistoricTitleAbstract || !Array.isArray(data.Title.HistoricTitleAbstract)) {
    return result;
  }

  data.Title.HistoricTitleAbstract.forEach((item: any) => {
    const temp = {
      vin: data.VehicleIdentification?.IdentificationID || null,
      titleBrandDate: item?.TitleIssueDate?.Date || null,
      IdentificationID: item?.TitleIssuingAuthorityName || null,
      status: "History",
      ReportingEntityCategoryCode: "T",
      VehicleOdometerReadingMeasure: item?.VehicleOdometerReadingMeasure || null,
      VehicleOdometerReadingUnitCode: item?.VehicleOdometerReadingUnitCode || null,
      RecordMatchSequenceID: item?.RecordMatchSequenceID || null,
    };
    result.push(temp);
  });

  return result;
};



export const  findMaxTitleBrandDate=(data:any) =>{
  if (!Array.isArray(data) || data.length === 0) {
      return '-'; // Return null if data is not an array or empty
  }
  
  return data.reduce((maxDate, item) => {
      if (item.titleBrandDate && (!maxDate || new Date(item.titleBrandDate) > new Date(maxDate))) {
          return item.titleBrandDate;
      }
      return maxDate;
  }, null);
}
