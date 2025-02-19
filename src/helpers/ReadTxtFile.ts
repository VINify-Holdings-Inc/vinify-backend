
export const ReadTheTxtFomatJson = (input: any) => {
    const lines = input?.split("\n");
    const RowLines: any = [];
    lines?.map((item: any) => {
        const subArray = item?.split(" ")?.filter(Boolean);
        RowLines.push(subArray);
    });
    const finalResult: any = [];
    RowLines?.slice(0, -1)?.map((item2: any) => {
        const obj: any = {};

        if (item2?.length > 3) {
            obj.vin = item2[0]?.startsWith("V") ? item2[2] : item2[1]?.slice(2);
            obj.status = item2[0]?.startsWith("V") ? "Current" : "History";
            obj.vinId = item2[0]?.slice(0, 3);
            obj.brand = obj.brand = item2[1] ? String(Number(item2[1].slice(0, 2))) : item2[1].slice(0, 2);
            obj.titleBrandDate = item2[0]?.startsWith("V") ?
                item2[4]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") :
                item2[3]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
            obj.state = item2[0]?.startsWith("V") ? item2[3] : item2[2];
            obj.extra = item2[0]?.startsWith("V") ? item2[5] : item2[4];
            finalResult.push(obj);
        }
    });

    return finalResult;
};     