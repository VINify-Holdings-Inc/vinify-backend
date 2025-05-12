

export const transformVehicleDataToJsonTitle = (JsonDataTitle: any) => {
   
  const Title=JsonDataTitle?.Title
  const result: any = [];
  if (!Title) {
    return result;
  }
  const processData = (data: any, status = "Current") => {
    return {
      vin: data.VehicleIdentification?.IdentificationID || null,
      titleBrandDate: data?.TitleIssueDate?.Date || null,
      IdentificationID: data?.TitleIssuingAuthorityName?.trim() || null,
      status,
      ReportingEntityCategoryCode: "T",
      VehicleOdometerReadingMeasure: data?.VehicleOdometerReadingMeasure || null,
      VehicleOdometerReadingUnitCode: data?.VehicleOdometerReadingUnitCode || null,
      RecordMatchSequenceID: data?.RecordMatchSequenceID || null,
      alertType: "Title"
    };
  };

  const handleHistoricData = (historicData: any) => {
    if (Array.isArray(historicData)) {
      historicData.forEach((item) => {
        result.push(processData(item, "History"));
      });
    } else if (typeof historicData === "object" && historicData !== null) {
      result.push(processData(historicData, "History"));
    }
  };

  if (Array.isArray(Title)) {
    Title.forEach((data) => {
      result.push(processData(data));

      if (data.HistoricTitleAbstract) {
        handleHistoricData(data.HistoricTitleAbstract);
      }
    });
  } else if (typeof Title === "object" && Title !== null) {
    result.push(processData(Title));

    if (Title.HistoricTitleAbstract) {
      handleHistoricData(Title.HistoricTitleAbstract);
    }
  }

  return result;
};

export const transformVehicleDataToJson = (data: any) => {
  const result: any[] = [];

  // Handle VehicleDesignationAbstract as both object and array
  const vehicleDesignationArray = Array.isArray(data?.VehicleDesignationAbstract)
    ? data.VehicleDesignationAbstract
    : data?.VehicleDesignationAbstract
    ? [data.VehicleDesignationAbstract]
    : [];

  vehicleDesignationArray.forEach((item: any) => {
    // Check if both VehicleBrandDate and VehicleBrandCode are available
    const isBrandCodePresent = Boolean(item?.VehicleBrandCode);

    if (isBrandCodePresent) {
      // If both are present, prepare the Brand alert type object
      const temp = {
        vin: data.VehicleIdentification?.IdentificationID || null,
        titleBrandDate: item?.VehicleBrandDate?.Date || null,
        brand: item?.VehicleBrandCode ? item.VehicleBrandCode.replace(/^0/, "") : null,
        ReportingEntityCategoryCode: item?.ReportingEntityAbstract?.ReportingEntityCategoryCode || null,
        IdentificationID: item?.ReportingEntityAbstract?.IdentificationID?.trim() || null,
        ReportingEntityCategoryText: item?.ReportingEntityAbstract?.ReportingEntityCategoryText || null,
        EntityName: item?.ReportingEntityAbstract?.EntityName?.trim() || null,
        alertType: "Brand",
      };
      result.push(temp);
    } else {
      // Prepare the JSI alert type object
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
        export: item?.VehicleIntendedForExportCode === undefined ? null : item.VehicleIntendedForExportCode === "N"  ? "no" : "yes",
        alertType: "JSI",
      };
      result.push(temp);
    }
  });
  // console.log(result,"result");

  return result;
}; 

export const findMaxTitleBrandDate = (data: any) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "-"; // Return null if data is not an array or empty
  }

  return data.reduce((maxDate, item) => {
    if (item.titleBrandDate && (!maxDate || new Date(item.titleBrandDate) > new Date(maxDate))) {
      return item.titleBrandDate;
    }

    return maxDate;
  }, null);
};
