
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
export const deleteISDelItem = async (TableName: any) => {
  await TableName
    .createQueryBuilder()
    .update(TableName)
    .set({ isDel: true })
    .execute();
};

export const changedDataToComapreData = (oldArray: any[], newArray: any[]) => {
  const result: any[] = [];
  newArray.forEach(newItem => {
    const matchedOld = oldArray.find(oldItem =>
      oldItem.vin?.trim() === newItem.vin?.trim() && oldItem.titleUnique?.trim() === newItem.titleUnique?.trim() &&  oldItem.state?.trim() === newItem.state?.trim() && oldItem.titleBrandDate?.trim() === newItem.titleBrandDate?.trim() 
    );
    if (matchedOld) {
      result.push({
        vin: newItem?.vin,
        titleBrandDate: newItem?.titleBrandDate,
        state: newItem?.state,
        alertType: "Title",
        vinId: newItem?.vinId,
        extra: newItem?.extra,
        isRead: matchedOld?.isRead,
        titleUnique: newItem?.titleUnique,
        status: newItem?.status,
        isOld: true,
        odometer: newItem?.odometer,
        createdAt: matchedOld?.createdAt,
        updatedAt: matchedOld?.updatedAt,
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
export const findIsDeletedItems = (vehicleTemData: any[], changedDataToComapre: any[]) => {
  // Step 1: Filter changedDataToComapre where isOld === true
  const filteredChangedData = changedDataToComapre?.filter(item => item?.isOld === true);

  // Step 2: Create a Set of combined keys from filteredChangedData
  const changedKeys = new Set(
    filteredChangedData.map(item => `${item.vin}|${item.titleUnique}|${item.state}|${item.titleBrandDate}`)
  );

  // Step 3: Identify items in vehicleTemData not present in changedKeys
  const deletedItems = vehicleTemData
    .filter(item => !changedKeys.has(`${item.vin}|${item.titleUnique}|${item.state}|${item.titleBrandDate}`))
    .map(item => ({
      ...item,
      isOld: false,
      isDel: true
    }));

  // Step 4: Return the result
  return deletedItems;
};

export const brandChangedDataToCompareData = (oldArray: any[], newArray: any[]) => {
  const result: any[] = [];
  newArray.forEach(newItem => {
    const matchedOld = oldArray.find(
      (oldItem) =>
        oldItem.vin === newItem.vin &&
        oldItem.titleBrandDate === newItem.titleBrandDate &&
        oldItem.brand === newItem.brand &&
        oldItem.state === newItem.state &&
        oldItem.alertType === newItem.alertType
    );

    if (matchedOld) {
      result.push({
        vin: newItem?.vin,
        titleBrandDate: newItem?.titleBrandDate,
        state: newItem?.state,
        alertType: newItem?.alertType,
        brand: newItem?.brand,
        isOld: true,
        isRead: matchedOld?.isRead,
        createdAt: matchedOld?.createdAt,
        updatedAt: matchedOld?.updatedAt,
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
export const findIsDeletedItemsBrand = (vehicleTemData: any[], changedDataToComapre: any[]) => {
  // Step 1: Filter changedDataToComapre for isOld === true
  const filteredChangedData = changedDataToComapre?.filter(item => item?.isOld === true);

  // Step 2: Create a Set of unique keys for comparison from filtered changed data
  const changedItemKeys = new Set(
    filteredChangedData?.map(item =>
      `${item?.vin}|${item?.titleBrandDate}|${item?.brand}|${item?.state}|${item?.alertType}`
    )
  );

  // Step 3: Iterate over vehicleTemData to find deletions
  const deletedItems = vehicleTemData
    ?.filter(item => {
      const key = `${item?.vin}|${item?.titleBrandDate}|${item?.brand}|${item?.state}|${item?.alertType}`;

      return !changedItemKeys.has(key);
    })
    ?.map(item => ({
      ...item,
      isOld: false,
      isDel: true
    }));

  // Step 4: Return the result
  return deletedItems;
};
export const JsiChangedDataToCompareData = (oldArray: any[], newArray: any[]) => {

  const result: any[] = [];
  newArray.forEach(newItem => {
    const matchedOld = oldArray.find(oldItem => oldItem?.vin === newItem?.vin &&
      oldItem?.titleBrandDate === newItem?.titleBrandDate &&
      oldItem?.email === newItem?.email &&
      oldItem?.mobile === newItem?.mobile &&
      oldItem?.export === newItem?.export &&
      oldItem?.state === newItem?.state &&
      oldItem?.alertType === newItem?.alertType &&
      oldItem?.description === newItem?.description &&
      oldItem?.city === newItem?.city &&
      oldItem?.rptgEntity === newItem?.rptgEntity


      
    );
    if (matchedOld) {
      result.push({
        vin: newItem?.vin,
        titleBrandDate: newItem?.titleBrandDate,
        state: newItem?.state,
        alertType: newItem?.alertType,
        export: newItem?.export,
        rptgEntity: newItem?.rptgEntity,
        email: newItem?.email,
        mobile: newItem?.mobile,
        description: newItem?.description,
        city: newItem?.city,
        isOld: true,
        isRead: matchedOld?.isRead,
        createdAt: matchedOld?.createdAt,
        updatedAt: matchedOld?.updatedAt,
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

export const findIsDeletedItemsJSI = (vehicleTemData: any[], changedDataToComapre: any[]) => {
  // Step 1: Filter changedDataToComapre for isOld === true
  const filteredChangedData = changedDataToComapre?.filter(item => item?.isOld === true);

  // Step 2: Create a Set of unique keys for comparison from filtered changed data
  const changedItemKeys = new Set(
    filteredChangedData?.map(item =>
      `${item?.vin}|${item?.titleBrandDate}|${item?.email}|${item?.mobile}|${item?.export}|${item?.state}|${item?.alertType}|${item?.description}|${item?.city}|${item?.rptgEntity}`
    )
  );

  // Step 3: Iterate over vehicleTemData to find deletions
  const deletedItems = vehicleTemData
    ?.filter(item => {
      const key = `${item?.vin}|${item?.titleBrandDate}|${item?.email}|${item?.mobile}|${item?.export}|${item?.state}|${item?.alertType}|${item?.description}|${item?.city}|${item?.rptgEntity}`;

      return !changedItemKeys.has(key);
    })
    ?.map(item => ({
      ...item,
      isOld: false,
      isDel: true
    }));

  // Step 4: Return the result
  return deletedItems;
}; 