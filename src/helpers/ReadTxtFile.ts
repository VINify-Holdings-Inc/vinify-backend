import fs from "fs";
import readline from "readline";

export const ReadTheTxtFormatJsonStream = async (filePath: any) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let data = '';

  for await (const line of rl) {
    data += line + '\n';
  }

  // Original logic preserved
  const lines = data.split("\n").map(line => line.trim()).filter(line => line !== "");

  const vehicleLines = lines.filter(line =>
    line.startsWith("V01") || line.startsWith("V") || line.startsWith("H")
  );

  const parsedData = vehicleLines.map(line => {
    const rawVin = line.substring(0, 33).trim();
    const vin = rawVin.substring(3).trim();

    const status = line.startsWith("V") ? "Current" :
      line.startsWith("H") ? "History" : "Unknown";

    const rawOdometer = line.substring(143, 207).trim();
    let odometer = "";
    const match = rawOdometer.match(/^0*([\d]+)([MK]?)$/i);

    if (match) {
      const rawNumber = match[1];
      const withCommas = rawNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      odometer = match[2] ? `${withCommas} ${match[2].toUpperCase() === 'M' ? 'Miles' : 'KM'}` : withCommas;
    } else {
      odometer = rawOdometer;
    }

    const rawTitleUnique = line.substring(143, 207).trim();
    let titleUnique = "";
    const matchtitleUnique = rawTitleUnique.match(/0*([\d]+)([MK])/i);

    if (matchtitleUnique) {
      const rawNumber = matchtitleUnique[1];
      const withCommas = rawNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      titleUnique = matchtitleUnique[2].toUpperCase() === "M"
        ? `${withCommas} Miles`
        : `${withCommas} KM`;
    } else {
      titleUnique = rawTitleUnique.trim().split(" ")[0];
    }
    return {
      vin,
      status,
      vinId: rawVin.substring(0, 3).trim(),
      extra: line.substring(33, 68).trim(),
      state: line.substring(68, 70).trim(),
      titleBrandDate: line.substring(71, 143).trim()?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      odometer,
      titleUnique,
      alertType: "Title"
    };
  });

  return parsedData;
}
export async function parseVehicleDataBrandStream(filePath: string) {
  const result: any[] = [];
  try {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const mainstr = line.trimEnd();
      if (mainstr === "") continue;

      const vin = mainstr.slice(3, 30).trim(); // slice(1, 30) as per your logic
      // const count = mainstr.slice(30, 40).trim();
      const state = mainstr.slice(40, 46).trim();
      const brandCode = String(Number(mainstr.slice(46, 53).trim()));
      const dateRaw = mainstr.slice(53, 68).trim();
      const formattedDate = dateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      if (!mainstr.slice(0, 3).startsWith("C")) {
        result.push({
          vin,
          state,
          brand:brandCode,
          titleBrandDate: formattedDate,
          alertType:"Brand"
        });
      }

    }

    return result;
  } catch (error) {
    console.error("Error during vehicle data parsing:", error);
    return [];
  }
}

export async function parseVehicleDataJSIStream(filePath: string) {
  const result: any[] = [];

  try {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine === "") continue;

      const rawVinSection = trimmedLine.slice(0, 30).trim();
      const rawTitleDateSection = trimmedLine.slice(30, 61).trim();
      const rawDescriptionSection = trimmedLine.slice(61, 118).trim();
      const city = trimmedLine.slice(118, 143).trim();
      const rawEmailSection = trimmedLine.slice(143, 214).trim();
      // const rawExtraSection = trimmedLine.slice(214, 221).trim();

      const vin = rawVinSection.substring(1, 30).trim();
      const titleBrandDateRaw = rawTitleDateSection.substring(0, 8).trim();
      const titleBrandDate = titleBrandDateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const description = rawTitleDateSection.substring(8).trim();

      const exportFlag = rawDescriptionSection.substring(0, 1);
      const exportStatus = exportFlag === "Y" ? "yes" : "no";

      const rptgEntity = rawDescriptionSection.substring(1).trim();

      const state = rawEmailSection.substring(0, 2).trim();
      const mobile = rawEmailSection.substring(2, 12).trim();
      const email = rawEmailSection.substring(12).trim();
      if (!rawVinSection.startsWith("C")) {

        result.push({
          vin,
          titleBrandDate,
          description,
          export: exportStatus,
          rptgEntity,
          city,
          state,
          mobile,
          email,
          alertType: "JSI",
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error during JSI vehicle data parsing:", error);
    return [];
  }
}


// function parseBrandData(input) {
//     const lines = input
//     .split('\n')
//     .map(line => line.trimEnd())  // only remove trailing whitespace
//     .filter(line => line !== "");

//   return lines.map(mainstr => {
//     // Optional: debug what slices contain
//     // console.log("RAW LINE:", mainstr);
//     const vin = mainstr.slice(1, 30).trim();
//     const count = mainstr.slice(30, 40).trim();
//     const state = mainstr.slice(40, 46).trim();
//     const brandCode = String(Number(mainstr.slice(46, 53).trim()));
//     const dateRaw = mainstr.slice(53).trim();
//     const formattedDate = dateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") ;

//     return {
//       vin,
//       count,
//       state,
//       brandCode,
//       date: formattedDate,
//     };
//   });
// }


// function parseTitleData(input) {
//   const lines = input.split('\n').map(line => line.trim()).filter(line => line !== "");

//   return lines.map(line => {
//     const rawVinSection = line.slice(0, 30).trim();
//     const rawTitleDateSection = line.slice(30, 61).trim();
//     const rawDescriptionSection = line.slice(61, 118).trim();
//     const city = line.slice(118, 143).trim();
//     const rawEmailSection = line.slice(143, 214).trim();
//     const rawExtraSection = line.slice(214, 221).trim();

//     const vin = rawVinSection.substring(1, 30).trim();
//     const titleBrandDateRaw = rawTitleDateSection.substring(0, 8).trim();
//     const titleBrandDate = titleBrandDateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
//     const description = rawTitleDateSection.substring(8).trim();

//     const exportFlag = rawDescriptionSection.substring(0, 1);
//     const exportStatus = exportFlag === "Y" ? "yes" : "no";

//     const rptgEntity = rawDescriptionSection.substring(1).trim();

//     const state = rawEmailSection.substring(0, 2).trim();
//     const mobile = rawEmailSection.substring(2, 12).trim();
//     const email = rawEmailSection.substring(12).trim();

//     return {
//       vin,
//       titleBrandDate,
//       description,
//       export: exportStatus,
//       rptgEntity,
//       city,
//       state,
//       mobile,
//       email,
//       alertType: "JSI",
//     };
//   });
// }


