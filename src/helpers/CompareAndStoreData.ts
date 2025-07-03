import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";

export const TitleDataCompare = async () => {

    //update the vin isOld Column  
  const qb = VehicleDataTemp.createQueryBuilder(); 
  const subQuery = qb
    .subQuery()
    .select("1")
    .from(VehicleData, "vd")
    .where(`vd.alertType = :type`)
    .andWhere(`vd.vin = "VehicleDataTemp".vin`)
    .andWhere(`vd.odometer = "VehicleDataTemp".odometer`)
    .getQuery();

  await qb
    .update(VehicleDataTemp)
    .set({ isOld: true })
    .where(`"alertType" = :type`)
    .andWhere(`EXISTS ${subQuery}`)
    .setParameter("type", "Title")
    .execute();
};
