 
import { AppDataSource } from "../DbConfig/TypeOrm"; 
 
export const truncateTable = async (entity: any) => {
  try {
    const repository = AppDataSource.getRepository(entity);
    await repository.query(`TRUNCATE TABLE "${repository.metadata.tableName}" RESTART IDENTITY CASCADE;`);
  } catch (error) {
      // tslint:disable-next-line:no-console
    console.error(`Error truncating table ${entity.name}:`, error);
    throw new Error("Failed to truncate table.");
  }
}; 
export const changedDataToComapreData = (oldArray: any, newArray: any) =>  {
  return newArray.filter((newItem: any) => 
      oldArray.some((oldItem: any) => 
          newItem.vin === oldItem.vin &&
          newItem.vinId === oldItem.vinId &&
          newItem.alertDate === oldItem.alertDate &&
          newItem.status === oldItem.status &&
          newItem.brand === oldItem.brand &&
          // newItem.export === oldItem.export &&
          newItem.state === oldItem.state &&
          newItem.alertType === oldItem.alertType
      )
  );
};

export const findDifferencesFromTemData = (data: any, data2: any) => {
  // Normalize the data by mapping them to a consistent structure for comparison
  const normalize = (item: any) => ({
    vin: item?.vin,
    vinId: item?.vinId, // Trimming whitespace from vinId
    alertDate: item?.alertDate, // Stripping time part from alertDate
    status: item?.status,
    brand: item?.brand,
    // export: item?.export,
    state: item?.state,
    alertType: item?.alertType,
  });

  // Find records in data2 that are different from data based on vin, vinId, alertDate, and other fields
  return data2.filter((item2: any) => {
    const normalizedItem2 = normalize(item2);

    return !data.some((item1: any) => {
      const normalizedItem1 = normalize(item1);

      // Compare values
      return (
        normalizedItem1.vin === normalizedItem2.vin &&
        normalizedItem1.vinId === normalizedItem2.vinId &&
        normalizedItem1.alertDate === normalizedItem2.alertDate &&
        normalizedItem1.status === normalizedItem2.status &&
        normalizedItem1.brand === normalizedItem2.brand &&
        // normalizedItem1.export === normalizedItem2.export &&
        normalizedItem1.state === normalizedItem2.state &&
        normalizedItem1.alertType === normalizedItem2.alertType
      );
    });
  });
};

export const brandChangedDataToCompareData = (oldArray: any, newArray: any) => {
  return newArray.filter((newItem: any) =>
    oldArray.some((oldItem: any) =>
      newItem.vin === oldItem.vin &&
      newItem.alertDate === oldItem.alertDate &&
      newItem.brand === oldItem.brand &&
      // newItem.export === oldItem.export &&
      newItem.state === oldItem.state &&
      newItem.alertType === oldItem.alertType
    )
  );
};   

export const brandFindDifferencesFromTempData = (data: any, data2: any) => {
  const normalize = (item: any) => ({
    vin: item?.vin,
    alertDate: item?.alertDate,
    brand: item?.brand,
    // export: item?.export,
    state: item?.state,
    alertType: item?.alertType,
  });

  return data2.filter((item2: any) => {
    const normalizedItem2 = normalize(item2);

    return !data.some((item1: any) => {
      const normalizedItem1 = normalize(item1);

      return (
        normalizedItem1.vin === normalizedItem2.vin &&
        normalizedItem1.alertDate === normalizedItem2.alertDate &&
        normalizedItem1.brand === normalizedItem2.brand &&
        // normalizedItem1.export === normalizedItem2.export &&
        normalizedItem1.state === normalizedItem2.state &&
        normalizedItem1.alertType === normalizedItem2.alertType
      );
    });
  });
};


export const JsiChangedDataToCompareData = (oldArray: any, newArray: any) => {
  return newArray.filter((newItem: any) =>
    oldArray.some((oldItem: any) =>
      newItem.vin === oldItem.vin &&
      newItem.alertDate === oldItem.alertDate &&
      newItem.status === oldItem.status &&
      newItem.brand === oldItem.brand &&
      newItem.export === oldItem.export &&
      newItem.state === oldItem.state &&
      newItem.alertType === oldItem.alertType &&
      newItem.description === oldItem.description &&
      newItem.city === oldItem.city &&
      newItem.rptgEntity === oldItem.rptgEntity &&
      newItem.rptgDetails === oldItem.rptgDetails
    )
  );
};

export const JsiFindDifferencesFromTempData = (data: any, data2: any) => {
  const normalize = (item: any) => ({
    vin: item?.vin,
    alertDate: item?.alertDate,
    status: item?.status,
    brand: item?.brand,
    export: item?.export,
    state: item?.state,
    alertType: item?.alertType,
    description: item?.description,
    city: item?.city,
    rptgEntity: item?.rptgEntity,
    rptgDetails: item?.rptgDetails,
  });

  return data2.filter((item2: any) => {
    const normalizedItem2 = normalize(item2);

    return !data.some((item1: any) => {
      const normalizedItem1 = normalize(item1);

      return (
        normalizedItem1.vin === normalizedItem2.vin &&
        normalizedItem1.alertDate === normalizedItem2.alertDate &&
        normalizedItem1.status === normalizedItem2.status &&
        normalizedItem1.brand === normalizedItem2.brand &&
        normalizedItem1.export === normalizedItem2.export &&
        normalizedItem1.state === normalizedItem2.state &&
        normalizedItem1.alertType === normalizedItem2.alertType &&
        normalizedItem1.description === normalizedItem2.description &&
        normalizedItem1.city === normalizedItem2.city &&
        normalizedItem1.rptgEntity === normalizedItem2.rptgEntity &&
        normalizedItem1.rptgDetails === normalizedItem2.rptgDetails
      );
    });
  });
};
