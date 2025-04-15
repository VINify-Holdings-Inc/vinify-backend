
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
 
export const changedDataToComapreData = (oldArray: any[], newArray: any[]) => {
  const result: any[] = []; 
  newArray.forEach(newItem => {
    const matchedOld = oldArray.find(oldItem =>
      oldItem.vin?.toString().trim() === newItem.vin?.toString().trim() && oldItem.titleUnique?.toString().trim() === newItem.titleUnique?.toString().trim()
    ); 
    if (matchedOld) {
      result.push({
        vin:matchedOld.vin, 
        titleBrandDate: newItem.titleBrandDate,
        state: newItem.state,
        alertType: "Title",
        vinId: newItem.vinId,
        extra: newItem.extra,
        isRead:matchedOld?.isRead,
        titleUnique: newItem.titleUnique,
        status: newItem.status,
        isOld: true,
      });
    } else {
      result.push({
        ...newItem,
        isOld: false,
      });
    }
  });

  return result;
};




 

export const brandChangedDataToCompareData = (oldArray: any, newArray: any) => {
  return oldArray.filter((oldItem: any) =>
    newArray.some((newItem: any) =>
      newItem.vin === oldItem.vin &&
      newItem.titleBrandDate === oldItem.titleBrandDate &&
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
    titleBrandDate: item?.titleBrandDate,
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
        normalizedItem1.titleBrandDate === normalizedItem2.titleBrandDate &&
        normalizedItem1.brand === normalizedItem2.brand &&
        // normalizedItem1.export === normalizedItem2.export &&
        normalizedItem1.state === normalizedItem2.state &&
        normalizedItem1.alertType === normalizedItem2.alertType
      );
    });
  });
};

export const JsiChangedDataToCompareData = (oldArray: any, newArray: any) => {
  return oldArray.filter((oldItem: any) =>
    newArray.some((newItem: any) =>
      newItem.vin === oldItem.vin &&
      newItem.titleBrandDate === oldItem.titleBrandDate &&
      newItem.email === oldItem.email &&
      newItem.mobile === oldItem.mobile &&
      newItem.brand === oldItem.brand &&
      newItem.export === oldItem.export &&
      newItem.state === oldItem.state &&
      newItem.alertType === oldItem.alertType &&
      newItem.description === oldItem.description &&
      newItem.city === oldItem.city &&
      newItem.rptgEntity === oldItem.rptgEntity
      // newItem.rptgDetails === oldItem.rptgDetails
    )
  );
};

export const JsiFindDifferencesFromTempData = (data: any, data2: any) => {
  const normalize = (item: any) => ({
    vin: item?.vin,
    titleBrandDate: item?.titleBrandDate,
    email: item?.email,
    mobile: item?.mobile,
    brand: item?.brand,
    export: item?.export,
    state: item?.state,
    alertType: item?.alertType,
    description: item?.description,
    city: item?.city,
    rptgEntity: item?.rptgEntity
    // rptgDetails: item?.rptgDetails,
  });

  return data2.filter((item2: any) => {
    const normalizedItem2 = normalize(item2);

    return !data.some((item1: any) => {
      const normalizedItem1 = normalize(item1);

      return (
        normalizedItem1.vin === normalizedItem2.vin &&
        normalizedItem1.titleBrandDate === normalizedItem2.titleBrandDate &&
        normalizedItem1.email === normalizedItem2.email &&
        normalizedItem1.mobile === normalizedItem2.mobile &&
        normalizedItem1.brand === normalizedItem2.brand &&
        normalizedItem1.export === normalizedItem2.export &&
        normalizedItem1.state === normalizedItem2.state &&
        normalizedItem1.alertType === normalizedItem2.alertType &&
        normalizedItem1.description === normalizedItem2.description &&
        normalizedItem1.city === normalizedItem2.city &&
        normalizedItem1.rptgEntity === normalizedItem2.rptgEntity
        // normalizedItem1.rptgDetails === normalizedItem2.rptgDetails
      );
    });
  });
};
