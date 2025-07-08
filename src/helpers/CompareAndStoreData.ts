// import { getManager } from "typeorm";
import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";

export const TitleDataCompare = async () => {
  const matchCondition = `
    vd."vin" = "VehicleDataTemp"."vin" AND
    vd."titleUnique" = "VehicleDataTemp"."titleUnique" AND
    vd."alertType" = :type
  `;

  // Step 1: Update isOld, isRead, createdAt, updatedAt in VehicleDataTemp if matched
  await VehicleDataTemp.createQueryBuilder()
    .update(VehicleDataTemp)
    .set({
      isOld: true,
      isRead: () => `(SELECT vd."isRead" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`,
      createdAt: () => `(SELECT vd."createdAt" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`,
      updatedAt: () => `(SELECT vd."updatedAt" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`
    })
    .where(`"alertType" = :type`)
    .andWhere(`EXISTS (
      SELECT 1 FROM "VehicleData" vd WHERE ${matchCondition}
    )`)
    .setParameter("type", "Title")
    .execute();

  // Step 2: Insert unmatched records from VehicleData into VehicleDataTemp with isDel = true
  const type = "Title";

  await VehicleDataTemp.createQueryBuilder()
    .insert()
    .into(VehicleDataTemp)
    .values(
      await VehicleData.createQueryBuilder("vd")
        .select([
          `vd."vin"`,
          `vd."titleUnique"`,
          `vd."status"`,
          `vd."vinId"`,
          `vd."extra"`,
          `vd."state"`,
          `vd."titleBrandDate"`,
          `vd."odometer"`,
          `vd."alertType"`,
          `'system' AS "createdBy"`,
          `'system' AS "updatedBy"`,
          `uuid_generate_v4() AS "uuid"`,
          `vd."idSequence"`,
          `vd."isRead"`,
          `false AS "isOld"`,
          `true AS "isDel"`,
          `vd."createdAt"`,
          `vd."updatedAt"`
        ])
        .where(`vd."alertType" = :type`, { type })
        .andWhere(`vd."vin" IN (
          SELECT DISTINCT temp."vin" FROM "VehicleDataTemp" temp WHERE temp."alertType" = :type
        )`)
        .andWhere(`NOT EXISTS (
          SELECT 1 FROM "VehicleDataTemp" temp
          WHERE 
            vd."vin" = temp."vin" AND
            vd."titleUnique" = temp."titleUnique" AND
            vd."alertType" = temp."alertType"
        )`)
        .setParameters({ type })
        .getRawMany()
    )
    .execute();
};
 

export const BrandDataCompare = async () => {
  const matchCondition = `
    vd."vin" = "VehicleDataTemp"."vin" AND
    vd."titleBrandDate" = "VehicleDataTemp"."titleBrandDate" AND
    vd."brand" = "VehicleDataTemp"."brand" AND
    vd."state" = "VehicleDataTemp"."state" AND
    vd."alertType" = :type
  `;

  // Step 1: Mark matching records as isOld, and carry over isRead, createdAt, updatedAt
  await VehicleDataTemp.createQueryBuilder()
    .update(VehicleDataTemp)
    .set({
      isOld: true,
      isRead: () => `(SELECT vd."isRead" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`,
      createdAt: () => `(SELECT vd."createdAt" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`,
      updatedAt: () => `(SELECT vd."updatedAt" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`
    })
    .where(`"alertType" = :type`)
    .andWhere(`EXISTS (
      SELECT 1 FROM "VehicleData" vd WHERE ${matchCondition}
    )`)
    .setParameter("type", "Brand")
    .execute();

  // Step 2: Insert old matching records back into VehicleDataTemp for record-keeping
  const type = "Brand";

  await VehicleDataTemp.createQueryBuilder()
    .insert()
    .into(VehicleDataTemp)
    .values(
      await VehicleData.createQueryBuilder("vd")
        .select([
          `vd."vin"`,
          `vd."titleBrandDate"`,
          `vd."brand"`,
          `vd."state"`,
          `vd."alertType"`,
          `'system' AS "createdBy"`,
          `'system' AS "updatedBy"`,
          `uuid_generate_v4() AS "uuid"`,
          `vd."idSequence"`,
          `vd."isRead"`,
          `false AS "isOld"`,
          `true AS "isDel"`,
          `vd."createdAt"`,
          `vd."updatedAt"`
        ])
        .where(`vd."alertType" = :type`, { type })
        .andWhere(`vd."vin" IN (
          SELECT DISTINCT temp."vin" FROM "VehicleDataTemp" temp WHERE temp."alertType" = :type
        )`)
        .andWhere(`NOT EXISTS (
          SELECT 1 FROM "VehicleDataTemp" temp
          WHERE 
            vd."vin" = temp."vin" AND
            vd."titleBrandDate" = temp."titleBrandDate" AND
            vd."brand" = temp."brand" AND
            vd."state" = temp."state" AND
            vd."alertType" = temp."alertType"
        )`)
        .setParameters({ type })
        .getRawMany()
    )
    .execute();
};

export const JSIDataCompare = async () => {
 const matchCondition = `
  vd."vin" = "VehicleDataTemp"."vin" AND
  vd."titleBrandDate" = "VehicleDataTemp"."titleBrandDate" AND
  vd."email" = "VehicleDataTemp"."email" AND
  vd."mobile" = "VehicleDataTemp"."mobile" AND
  vd."export" = "VehicleDataTemp"."export" AND
  vd."state" = "VehicleDataTemp"."state" AND
  vd."description" = "VehicleDataTemp"."description" AND
  vd."city" = "VehicleDataTemp"."city" AND
  vd."rptgEntity" = "VehicleDataTemp"."rptgEntity" AND
  vd."alertType" = :type
`;

await VehicleDataTemp.createQueryBuilder()
  .update(VehicleDataTemp)
  .set({
    isOld: true,
    isRead: () => `(SELECT vd."isRead" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`,
    createdAt: () => `(SELECT vd."createdAt" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`,
    updatedAt: () => `(SELECT vd."updatedAt" FROM "VehicleData" vd WHERE ${matchCondition} LIMIT 1)`
  })
  .where(`"alertType" = :type`)
  .andWhere(`EXISTS (
    SELECT 1 FROM "VehicleData" vd WHERE ${matchCondition}
  )`)
  .setParameter("type", "JSI")
  .execute();


 const type = "JSI";

  await VehicleDataTemp.createQueryBuilder()
    .insert()
    .into(VehicleDataTemp)
    .values(
      await VehicleData.createQueryBuilder("vd")
        .select([
          `vd."vin"`,
          `vd."titleBrandDate"`,
          `vd."description"`,
          `vd."export"`,
          `vd."rptgEntity"`,
          `vd."city"`,
          `vd."state"`,
          `vd."mobile"`,
          `vd."email"`,
          `vd."alertType"`,
          `'system' AS "createdBy"`,
          `'system' AS "updatedBy"`,
          `uuid_generate_v4() AS "uuid"`,
          `vd."idSequence"`,
          `vd."isRead"`,
          `false AS "isOld"`,
          `true AS "isDel"`,
          `vd."createdAt"`,
          `vd."updatedAt"`
        ])
        .where(`vd."alertType" = :type`, { type })
        .andWhere(`vd."vin" IN (
          SELECT DISTINCT temp."vin" FROM "VehicleDataTemp" temp WHERE temp."alertType" = :type
        )`)
        .andWhere(`NOT EXISTS (
          SELECT 1 FROM "VehicleDataTemp" temp
          WHERE 
            vd."vin" = temp."vin" AND
            vd."titleBrandDate" = temp."titleBrandDate" AND
            vd."email" = temp."email" AND
            vd."mobile" = temp."mobile" AND
            vd."export" = temp."export" AND
            vd."state" = temp."state" AND
            vd."description" = temp."description" AND
            vd."city" = temp."city" AND
            vd."rptgEntity" = temp."rptgEntity" AND
            vd."alertType" = temp."alertType"
        )`)
        .setParameters({ type })
        .getRawMany()
    )
    .execute();

}; 

export const copyDataFromVehicleDataTemp = async () => {
  const tempRecords = await VehicleDataTemp.createQueryBuilder("temp")
    .select([
      `"vin"`,
      `"vinId"`,
      `"model"`,
      `"make"`,
      `"brand"`,
      `"state"`,
      `"alertType"`,
      `"titleBrandDate"`,
      `"modelYear"`,
      `"status"`,
      `"titleUnique"`,
      `"description"`,
      `"odometer"`,
      `"export"`,
      `"extra"`,
      `"city"`,
      `"rptgEntity"`,
      `"email"`,
      `"mobile"`,
      `"isRead"`,
      `"isOld"`,
      `"isDel"`,
      `"createdAt"`,
      `"updatedAt"`,
      `"createdBy"`,
      `"updatedBy"`,
      `"idSequence"`
    ])
    .getRawMany();

  if (tempRecords.length === 0) return;

  await VehicleData.createQueryBuilder()
    .insert()
    .into(VehicleData)
    .values(tempRecords)
    .execute();
};

// export const JSIDataCompare = async () => {
//   const qb = VehicleDataTemp.createQueryBuilder();

//   const subQuery = qb
//     .subQuery()
//     .select("1")
//     .from(VehicleData, "vd")
//     .where(`vd.alertType = :type`)
//     .andWhere(`vd.vin = "VehicleDataTemp"."vin"`)
//     .andWhere(`vd.titleBrandDate = "VehicleDataTemp"."titleBrandDate"`)
//     .andWhere(`vd.email = "VehicleDataTemp"."email"`)
//     .andWhere(`vd.mobile = "VehicleDataTemp"."mobile"`)
//     .andWhere(`vd.export = "VehicleDataTemp"."export"`)
//     .andWhere(`vd.state = "VehicleDataTemp"."state"`)
//     .andWhere(`vd.description = "VehicleDataTemp"."description"`)
//     .andWhere(`vd.city = "VehicleDataTemp"."city"`)
//     .andWhere(`vd.rptgEntity = "VehicleDataTemp"."rptgEntity"`)
//     .getQuery();

//   await qb
//     .update(VehicleDataTemp)
//     .set({ isOld: true })
//     .where(`"alertType" = :type`)
//     .andWhere(`EXISTS ${subQuery}`)
//     .setParameter("type", "JSI")
//     .execute();
// };
