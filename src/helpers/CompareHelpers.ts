 
import { AppDataSource } from "../DbConfig/TypeOrm"; 
// Function to format data for sheet1
export const formatSheet1 = (sheet1: any[]) => {
  return sheet1?.map(item => ({
    vin: item?.vin || null,
    titleStatus: item?.titleStatus || null,
    brand: item?.brand || null,
    insurance: item?.insurance || null,
    junkSalvage: item?.junkSalvage || null,
  }));
}; 
// Function to format data for sheet2
export const formatSheet2 = (sheet2: any[]) => {
  return sheet2?.map(item => ({
    vin: item?.vin || null,
    vinId: item?.vinId || null,
    status: item?.status || null,
    state: item?.state || null,
    brand: item?.brand || null,
    model: item?.model || null,
    modelYear: item?.modelYear || null,
    titleBrandDate: item?.titleBrandDate || null,
    member: item?.member || null,
  }));
}; 

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

export const formatSheetData = (sheetData: any) => {
  return sheetData
    .filter((item: any) => item?.vin)
    .map((item: any) => ({
      vin: item.vin,
      vinId: item?.vinId || null,
      status: item?.status || null,
      state: item?.state || null,
      brand: item?.brand || null,
      model: item?.model || null,
      modelYear: item?.modelYear || null,
      titleBrandDate: item?.titleBrandDate || null,
      member: item?.member || null,
    }));
}; 

export const updateIsNotFound = (oldArray: any, newArray: any) => {
  return oldArray?.map((oldItem: any) => {
      const exists = newArray?.some((newItem: any) => 
          newItem?.vin === oldItem?.vin &&
          newItem?.model === oldItem?.model &&
          newItem?.titleBrandDate === oldItem?.titleBrandDate &&
          newItem?.status === oldItem?.status
      );
      
      return { ...oldItem, isNotFound: !exists };
  });
}; 

export const findDifferencesFromTemData = (data: any, data2: any) => {
  // Normalize the data by mapping them to a consistent structure for comparison
  const normalize = (item: any) => ({
    vin: item?.vin, // Trimming whitespace from vin
    model: item?.model, // Include model in comparison
    titleBrandDate: item?.titleBrandDate, // Stripping time part from titleBrandDate
    status: item?.status,
  });

  // Find records in data2 that are different from data based on vin, model, titleBrandDate, and status
  return data2.filter((item2: any) => {
    const normalizedItem2 = normalize(item2);

    return !data.some((item1: any) => {
      const normalizedItem1 = normalize(item1);

      // Compare values
      return (
        normalizedItem1.vin === normalizedItem2.vin &&
        normalizedItem1.model === normalizedItem2.model &&
        normalizedItem1.titleBrandDate === normalizedItem2.titleBrandDate &&
        normalizedItem1.status === normalizedItem2.status
      );
    });
  });
};

export const changedDataToComapreData = (oldArray: any, newArray: any) =>  {
  return newArray.filter((newItem: any) => 
      oldArray.some((oldItem: any) => 
          newItem.vin === oldItem.vin &&
          newItem.model === oldItem.model &&
          newItem.titleBrandDate === oldItem.titleBrandDate &&
          newItem.status === oldItem.status
      )
  );
};