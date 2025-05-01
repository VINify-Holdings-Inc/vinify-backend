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
                .getRawOne(),
 


            VehicleData.createQueryBuilder("vehicle")
                .where("vehicle.vin = :vin", { vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "Brand" })
                .andWhere("vehicle.isOld = false")
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getRawOne(),

            VehicleData.createQueryBuilder("vehicle")
                .where("vehicle.vin = :vin", { vin })
                .andWhere("vehicle.alertType = :alertType", { alertType: "JSI" })
                .andWhere("vehicle.isOld = false")
                .orderBy("vehicle.titleBrandDate", "DESC")
                .addOrderBy("vehicle.createdAt", "DESC")
                .limit(1)
                .getRawOne()
        ]);
 console.log(vin,hasTitle, hasBrand, hasJSI,"processing ");
 
        result.push({
            id: item?.id,
            vin,
            Title: !!hasTitle,
            Brand: !!hasBrand,
            JSI: !!hasJSI,
            isOld: !(hasTitle || hasBrand || hasJSI),
            isDel: hasTitle?.isDel || hasBrand?.isDel || hasJSI?.isDel

        });

    }

    return result;
};

