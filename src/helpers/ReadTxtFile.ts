
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
              obj.export = "-";
            //   vin  vinId status brand export  titleBrandDate state alertType
            obj.titleBrandDate = item2[0]?.startsWith("V") ?
                item2[4]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") :
                item2[3]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
            obj.state = item2[0]?.startsWith("V") ? item2[3] : item2[2];
            obj.extra = item2[0]?.startsWith("V") ? item2[5] : item2[4];
            obj.alertType = "Title", 
            finalResult.push(obj);
        }
    });

    return finalResult;
};   
export function parseVehicleDataBrand(input: any) {
    const lines = input?.split("\n")?.map((line: any) => line?.trim())?.filter((line: any) => line !== "");
  
    return lines?.map((line: any) => {
      const parts = line?.split(/\s+/); // Split by multiple spaces
      if (parts?.length < 5) return null; // Skip invalid lines
  
      const vin = parts[0]?.substring(3);  // Remove 'B' from the VIN
      // const exportStatus = parts[1]?.endsWith("Y") ? "yes" : "no";
      const state = parts[2];
      const brand = String(Number(parts[3]));
      const titleBrandDate = parts[4]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

      //   vin    status brand export  titleBrandDate state alertType      
      return {
        vin,
        titleBrandDate,
        alertType: "Brand",
        state,
        brand,
        export: "-",
        description: "",
        city: "", 
      };
    }).filter((item: any) => item !== null); 
  } 
 export  function parseVehicleDataJSI(input: any) {
    const lines = input?.split("\n")?.map((line: any) => line?.trim())?.filter((line: any) => line !== "");
  
    return lines
      ?.filter((line: any) => !line?.startsWith("CJSI")) // Ignore non-relevant lines dynamically
      ?.map((line: any) => {
        const parts = line?.split(/\s+/); // Dynamically split by multiple spaces
  
        if (parts?.length < 5) return null; // Ensure valid lines
  
        const vin = parts[0]?.substring(1); // Extract VIN (remove first character)
        const titleBrandDateMatch = parts[1]?.match(/^(\d{8})/); // Extract date if present
        const titleBrandDate = titleBrandDateMatch ? titleBrandDateMatch[1]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : "";
        
        const description = parts[1]?.replace(titleBrandDateMatch[1], "").trim(); // Extract description
        
        const exportStatus = parts[2]?.startsWith("Y") ? "yes" : "no"; // Extract Export (Y/N)
        
        const rptgEntity = parts?.slice(2, parts.length - 3)?.join(" "); // Extract Reporting Entity
        
        const city = parts[parts?.length - 3]; // Extract city dynamically
        const stateMatch = parts[parts?.length - 2]?.match(/^([A-Z]{2})/); // Extract state
        const state = stateMatch ? stateMatch[1] : "";
       
        const rptgDetails = parts[parts?.length - 2]?.replace(state, "")?.trim(); 
        const match = rptgDetails.match(/^(\d+)([A-Z@.]+)$/); 
        const mobile = match ? match[1] : "";
        const email = match ? match[2] : "";
        return {
          alertType: "JSI",
          titleBrandDate,
          state,
          brand: "",
          export: exportStatus,
          vin,
          rptgEntity: rptgEntity,
          email,
          mobile,
          make: "",
          model: "",
          modelYear: "",
          description,
          city
        };
      })?.filter((item: any) => item !== null); // Remove null entries
  }
  
          // vin  vinId status brand export  titleBrandDate state alertType description city rptgEntity rptgDetails
