export const ReadTheTxtFomatJson = (input: any) => {
  try {
    // Split the input into lines based on newline characters
    const lines = input?.split("\n");

    // Initialize an array to hold each row's raw and parsed content
    const RowLines: any = [];

    // Iterate over each line and split it into words
    lines?.map((item: any) => {
      // Split each line by spaces and filter out any empty strings
      const subArray = item?.split(" ")?.filter(Boolean);
      RowLines.push({ raw: item, parsed: subArray });
    });

    // Initialize an array to hold the final structured data
    const finalResult: any = [];

    // Iterate over each row (excluding the last one) to process the parsed data
    RowLines?.slice(0, -1)?.map(({ raw, parsed: item2 }: any) => {
      const obj: any = {};

      // Check if there are more than 3 words in the parsed line
      if (item2?.length > 3) {
        // Determine if the VIN is current or history based on the first character
        const isCurrent = item2[0]?.startsWith("V");

        // Assign the VIN based on whether it is current or history
        obj.vin = isCurrent ? item2[2] : item2[1]?.slice(2);
        obj.status = isCurrent ? "Current" : "History";
        obj.vinId = item2[0]?.slice(0, 3);  // VIN ID (first 3 characters)
        obj.brand = ""; // Default brand value
        obj.export = ""; // Default export value

        // Extract the title date (either from position 4 or 3 based on the status)
        const titleDate = isCurrent ? item2[4] : item2[3];

        // Format the title date into YYYY-MM-DD format
        obj.titleBrandDate = titleDate?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
        obj.state = isCurrent ? item2[3] : item2[2];  // Extract state

        // Extract additional content after the titleBrandDate in the raw text
        const titleDateMatch = raw.indexOf(titleDate);
        const extraContent = titleDateMatch !== -1 ? raw.slice(titleDateMatch + titleDate.length).trim() : "";
        obj.extra = extraContent; // Store extra content

        // Extract the first word after the titleBrandDate, and slice it to get a titleUnique
        const afterTitle = extraContent?.split(/\s+/)?.filter(Boolean);
        obj.titleUnique = (afterTitle[0] || "")?.slice(0, 10);

        // Match the odometer value (if any) from the first word after titleBrandDate
        const match = afterTitle[0]?.match(/^0*(\d+)([A-Za-z])?/);
        if (match) {
          const rawNumber = match[1]; // Extract raw odometer number
          const withCommas = rawNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Format with commas
          obj.odometer = match[2]  ? `${withCommas} ${match[2] === 'M' ? 'Miles' : 'KM'}`  : withCommas;
          } else {
            
          obj.odometer = afterTitle[0] || ""; // Set odometer if no match
        }

        // Set the alert type to "Title"
        obj.alertType = "Title";

        // Push the final object to the result array
        finalResult.push(obj);
      }
    });

    // Return the final structured result
    return finalResult;
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("Error during processing txt format to JSON:", error);

    // Return an empty array in case of an error
    return [];
  }
};

export function parseVehicleDataBrand(input: any) {
  try {
    // Split the input into lines and remove extra spaces, then filter out empty lines
    const lines = input?.split("\n")?.map((line: any) => line?.trim())?.filter((line: any) => line !== "");

    // Process each line and parse the parts
    return lines?.map((line: any) => {
      // Split the line into parts based on multiple spaces
      const parts = line?.split(/\s+/);

      // Skip lines that have fewer than 5 parts
      if (parts?.length < 5) return null;

      // Extract the VIN by removing the 'B' from the beginning
      const vin = parts[0]?.substring(3);

      // Extract the state and brand, convert brand to a number and then to a string
      const state = parts[2];
      const brand = String(Number(parts[3]));

      // Format the titleBrandDate to the format YYYY-MM-DD
      const titleBrandDate = parts[4]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

      // Return an object containing the parsed information
      // vin    status brand export  titleBrandDate state alertType      
      return {
        vin,
        titleBrandDate,
        alertType: "Brand",  // Set alertType as "Brand"
        state,
        brand,
      };
    }).filter((item: any) => item !== null); // Filter out null values from invalid lines
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("Error during vehicle data parsing:", error);

    // Return an empty array in case of an error
    return [];
  }
}

export function parseVehicleDataJSI(input: any) {
  try {
    // Split the input into lines, trim whitespace, and filter out empty lines
    const lines = input?.split("\n")?.map((line: any) => line?.trim())?.filter((line: any) => line !== "");

    // Process the lines to filter and map the relevant data
    return lines
      // Filter out non-relevant lines dynamically, skipping any line that starts with "CJSI"
      ?.filter((line: any) => !line?.startsWith("CJSI"))
      ?.map((line: any) => {
        // Split the line into parts based on multiple spaces
        const parts = line?.split(/\s+/);

        // Ensure that there are enough parts in the line for further processing
        if (parts?.length < 5) return null;

        // Extract the VIN by removing the first character
        const vin = parts[0]?.substring(1);

        // Try to extract the titleBrandDate from the second part of the line
        const titleBrandDateMatch = parts[1]?.match(/^(\d{8})/);
        const titleBrandDate = titleBrandDateMatch
          ? titleBrandDateMatch[1]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
          : ""; // Format the date to YYYY-MM-DD if found

        // Extract the description after removing the titleBrandDate from the second part
        const description = parts[1]?.replace(titleBrandDateMatch[1], "").trim();

        // Determine the export status based on the third part (Y or N)
        const exportStatus = parts[2]?.startsWith("Y") ? "yes" : "no";

        // Extract the Reporting Entity from the line (all parts from index 2 to the second-to-last element)
        const rptgEntity = parts?.slice(2, parts.length - 3)?.join(" ");

        // Extract the city from the third-to-last element
        const city = parts[parts?.length - 3];

        // Extract the state from the second-to-last element using a regular expression to match two capital letters
        const stateMatch = parts[parts?.length - 2]?.match(/^([A-Z]{2})/);
        const state = stateMatch ? stateMatch[1] : ""; // If state is found, assign it, else assign empty string

        // Extract the reporting details and split them into mobile and email
        const rptgDetails = parts[parts?.length - 2]?.replace(state, "")?.trim();
        const match = rptgDetails.match(/^(\d+)([A-Z@.]+)$/);
        const mobile = match ? match[1] : ""; // Extract mobile number if present
        const email = match ? match[2] : "";  // Extract email if present
        
        // Return the parsed object with the relevant fields
        return {
          alertType: "JSI", // Set alertType as "JSI"
          titleBrandDate,
          state, 
          export: exportStatus,
          vin,
          rptgEntity: rptgEntity,
          email,
          mobile, 
          description,
          city
        };
      })
      // Filter out null entries (in case the line was invalid)
      ?.filter((item: any) => item !== null);
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("Error during JSI vehicle data parsing:", error);

    // Return an empty array in case of an error
    return [];
  }
}
