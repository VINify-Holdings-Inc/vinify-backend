import { VehicleData } from "../Entities/vehicle_data";

export const correctedData = async (data: any[]) => {
    const result: any[] = [];

    for (const item of data) {
        const vin = item?.vin;

        const [hasTitle, hasBrand, hasJSI] = await Promise.all([
            VehicleData.createQueryBuilder("vehicle")
                .where("vehicle.vin = :vin", { vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "Title" })
                .andWhere("vehicle.isOld = false")
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getOne(),



            VehicleData.createQueryBuilder("vehicle")
                .where("vehicle.vin = :vin", { vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "Brand" })
                .andWhere("vehicle.isOld = false")
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getOne(),

            VehicleData.createQueryBuilder("vehicle")
                .where("vehicle.vin = :vin", { vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "JSI" })
                .andWhere("vehicle.isOld = false")
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getOne()
        ]); 
        result.push({
            // id: item?.id,
            vin,
            Title: !!hasTitle,
            Brand: !!hasBrand,
            JSI: !!hasJSI,
            isOld: !(hasTitle || hasBrand || hasJSI),
            isTitleDel: !!hasTitle?.isDel,
            isBrandDel: !!hasBrand?.isDel,
            isJSIDel: !!hasJSI?.isDel
        });

    }
    // console.log(result, "0865");

    return result;
};


