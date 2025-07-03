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

    return {
      vin,
      status,
      vinId: rawVin.substring(0, 3).trim(),
      extra: line.substring(33, 68).trim(),
      state: line.substring(68, 70).trim(),
      titleBrandDate: line.substring(71, 143).trim()?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      odometer,
      titleUnique: odometer,
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
      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      const parts = trimmedLine.split(/\s+/);

      if (parts.length < 5) continue;

      const vin = parts[0]?.substring(3);
      const state = parts[2];
      const brand = String(Number(parts[3]));
      const titleBrandDate = parts[4]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

      result.push({
        vin,
        titleBrandDate,
        alertType: "Brand",
        state,
        brand,
      });
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

    for await (const lineRaw of rl) {
      const line = lineRaw.trim();

      if (!line || line.startsWith("CJSI")) continue;

      const parts = line.split(/\s+/);

      if (parts.length < 5) continue;

      const vin = parts[0]?.substring(1);

      const titleBrandDateMatch = parts[1]?.match(/^(\d{8})/);
      const titleBrandDate = titleBrandDateMatch
        ? titleBrandDateMatch[1]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
        : "";

      const description = titleBrandDateMatch
        ? parts[1].replace(titleBrandDateMatch[1], "").trim()
        : "";

      const exportStatus = parts[2]?.startsWith("Y") ? "yes" : "no";

      const rptgEntity = parts.slice(2, parts.length - 3).join(" ");

      const city = parts[parts.length - 3];

      const stateMatch = parts[parts.length - 2]?.match(/^([A-Z]{2})/);
      const state = stateMatch ? stateMatch[1] : "";

      const rptgDetails = parts[parts.length - 2]?.replace(state, "")?.trim();

      const match = rptgDetails.match(/^(\d+)([A-Z@.]+)$/);
      const mobile = match ? match[1] : "";
      const email = match ? match[2] : "";

      result.push({
        alertType: "JSI",
        titleBrandDate,
        state,
        export: exportStatus,
        vin,
        rptgEntity,
        email,
        mobile,
        description,
        city,
      });
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


