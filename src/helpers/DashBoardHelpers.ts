import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";

export const correctedData = async (data: any[]) => {
    const result: any[] = [];

    for (const item of data) {
        const [queryTitle, queryBrand, queryJsi] = await Promise.all([
            VehicleData.createQueryBuilder("vehicle")
                .select([
                    "vehicle.*",
                    "masterstate.name AS state",
                    "masterbrand.name AS brand"
                ])
                .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
                .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
                .where("vehicle.vin = :vin", { vin: item?.vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "Title" })
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getRawOne(),

            VehicleData.createQueryBuilder("vehicle")
                .select([
                    "vehicle.*",
                    "masterstate.name AS state",
                    "masterbrand.name AS brand"
                ])
                .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
                .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
                .where("vehicle.vin = :vin", { vin: item?.vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "Brand" })
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getRawOne(),

            VehicleData.createQueryBuilder("vehicle")
                .select(["vehicle.*"])
                .where("vehicle.vin = :vin", { vin: item?.vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "JSI" })
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getRawOne()
        ]);

        result.push({
            id: item?.id,
            vin: item?.vin,
            vinId: queryTitle?.vinId ?? null,
            model: item?.model,
            make: item?.make,
            brand: item?.brand ? item?.brand :  queryBrand?.brand ,
            state: item?.state,
            alertType: item?.alertType,
            titleBrandDate: item?.titleBrandDate,
            modelYear: item?.modelYear ?? null,
            status: queryTitle?.status ?? item?.state ?? null,
            description: queryJsi?.description ?? null,
            export: queryJsi?.export ?? null,
            city: queryJsi?.city ?? null,
            rptgEntity: queryJsi?.rptgEntity ?? null,
            rptgDetails: queryJsi?.rptgDetails ?? null,
            isRead: item?.isRead,
            isOld: item?.isOld,
            createdAt: item?.createdAt,
            updatedAt: item?.updatedAt,
            createdBy: item?.createdBy,
            updatedBy: item?.updatedBy
        });
    }

    return result;
};
