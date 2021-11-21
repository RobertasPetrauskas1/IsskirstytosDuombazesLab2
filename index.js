const axios = require("axios");
const express = require("express");
const bp = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

const DB11 = process.env.DB11; // Vyru studentu informacija
const DB12 = process.env.DB12; // Moteru studenciu informacija
const DB21 = process.env.DB21; // Zurnalu bibliotekos dalis
const DB22 = process.env.DB22; // Knygu bibliotekos dalis

const DB11_API_KEY = process.env.DB11_API_KEY;
const DB12_API_KEY = process.env.DB12_API_KEY;
const DB21_API_KEY = process.env.DB21_API_KEY;
const DB22_API_KEY = process.env.DB22_API_KEY;

const port = 3001;

const mergeResults = (db1Result, db2Result) => {
  if (db1Result == null && db2Result == null) return {};
  else if (db1Result == null) return db2Result.data._source;
  else if (db2Result == null) return db1Result.data._source;
  else
    return {
      ...db1Result.data._source,
      ...db2Result.data._source,
    };
};

const mergeFinalResults = (db1Result, db2Result) => {
  if (db1Result == null && db2Result == null) return {};
  else if (db1Result == null) return db2Result;
  else if (db2Result == null) return db1Result;
  else
    return {
      ...db1Result,
      ...db2Result,
    };
};

const apiHeader = (apiKey) => {
  return {
    headers: {
      Authorization: "ApiKey " + apiKey,
    },
  };
};

app.get("/student/:id", async (req, res) => {
  const studentId = req.params.id;

  let db11Result = null;
  let db12Result = null;
  let db21Result = null;
  let db22Result = null;

  try {
    db11Result = await axios.get(
      `https://${DB11}/lab1_student/_doc/${studentId}`,
      apiHeader(DB11_API_KEY)
    );
  } catch (err) {}

  try {
    db12Result = await axios.get(
      `https://${DB12}/lab1_student/_doc/${studentId}`,
      apiHeader(DB12_API_KEY)
    );
  } catch (err) {}

  try {
    db21Result = await axios.get(
      `https://${DB21}/lab1_student/_doc/${studentId}`,
      apiHeader(DB21_API_KEY)
    );
  } catch (err) {}

  try {
    db22Result = await axios.get(
      `https://${DB22}/lab1_student/_doc/${studentId}`,
      apiHeader(DB22_API_KEY)
    );
  } catch (err) {}

  const mergedPrimaryResults = mergeResults(db11Result, db12Result);
  const mergedSecondaryResults = mergeResults(db21Result, db22Result);

  let finalResult = mergeFinalResults(
    mergedPrimaryResults,
    mergedSecondaryResults
  );

  if (Object.keys(finalResult).length) {
    res.status(200);
    res.send(finalResult);
  } else {
    res.status(404);
    res.send("Not Found");
  }
});

app.post("/student", async (req, res) => {
  const {
    studentId,
    first_name,
    last_name,
    birth_date,
    enrollment_year,
    username,
    password,
    email,
    address,
    phone_number,
    library_card,
    gender,
    fk_field,
  } = req.body;

  let isBoy = true;

  if (gender === "Female") {
    isBoy = false;
  }

  const db1ToUse = isBoy ? DB11 : DB12;
  const db1ToUseHeaders = isBoy
    ? apiHeader(DB11_API_KEY)
    : apiHeader(DB12_API_KEY);
  try {
    db1Result = await axios.post(
      `https://${db1ToUse}/lab1_student/_doc/${studentId}`,
      {
        first_name,
        last_name,
        birth_date,
        enrollment_year,
        email,
        address,
        phone_number,
        gender,
        fk_field,
      },
      db1ToUseHeaders
    );

    db21Result = await axios.post(
      `https://${DB21}/lab1_student/_doc/${studentId}`,
      {
        library_card,
        username,
        password,
      },
      apiHeader(DB21_API_KEY)
    );

    db22Result = await axios.post(
      `https://${DB22}/lab1_student/_doc/${studentId}`,
      {
        library_card,
        username,
        password,
      },
      apiHeader(DB22_API_KEY)
    );
  } catch (err) {
    console.log(err);
    res.status(err.response.status);
    res.send(err.response.statusText);
    return;
  }

  res.status(200);
  res.send("Created");
});

app.put("/student/:id", async (req, res) => {
  const studentId = req.params.id;
  const {
    first_name,
    last_name,
    birth_date,
    enrollment_year,
    username,
    password,
    email,
    address,
    phone_number,
    library_card,
    gender,
    fk_field,
  } = req.body;

  let isBoy = true;

  if (gender === "Female") {
    isBoy = false;
  }

  const db1ToUse = isBoy ? DB11 : DB12;
  const db1ToUseHeaders = isBoy
    ? apiHeader(DB11_API_KEY)
    : apiHeader(DB12_API_KEY);

  try {
    db1Result = await axios.post(
      `https://${db1ToUse}/lab1_student/_update/${studentId}`,
      {
        doc: {
          first_name,
          last_name,
          birth_date,
          enrollment_year,
          email,
          address,
          phone_number,
          gender,
          fk_field,
        },
      },
      db1ToUseHeaders
    );

    db21Result = await axios.post(
      `https://${DB21}/lab1_student/_update/${studentId}`,
      {
        doc: {
          library_card,
          username,
          password,
        },
      },
      apiHeader(DB21_API_KEY)
    );

    db22Result = await axios.post(
      `https://${DB22}/lab1_student/_update/${studentId}`,
      {
        doc: {
          library_card,
          username,
          password,
        },
      },
      apiHeader(DB22_API_KEY)
    );
  } catch (err) {
    console.log(err);
    res.status(err.response.status);
    res.send(err.response.statusText);
    return;
  }

  res.status(200);
  res.send("Updated");
});

app.delete("/student/:id", async (req, res) => {
  const studentId = req.params.id;

  let db11err = false;
  let db12err = false;
  let db21err = false;
  let db22err = false;

  try {
    await axios.delete(
      `https://${DB11}/lab1_student/_doc/${studentId}`,
      apiHeader(DB11_API_KEY)
    );
  } catch (err) {
    db11err = true;
  }

  try {
    await axios.delete(
      `https://${DB12}/lab1_student/_doc/${studentId}`,
      apiHeader(DB12_API_KEY)
    );
  } catch (err) {
    db12err = true;
  }

  try {
    await axios.delete(
      `https://${DB21}/lab1_student/_doc/${studentId}`,
      apiHeader(DB21_API_KEY)
    );
  } catch (err) {
    db21err = true;
  }

  try {
    await axios.delete(
      `https://${DB22}/lab1_student/_doc/${studentId}`,
      apiHeader(DB22_API_KEY)
    );
  } catch (err) {
    db22err = true;
  }

  if (!db11err || !db12err || !db21err || !db22err) {
    res.status(200);
    res.send("Deleted");
  } else {
    res.status(400);
    res.send(`No student with id: ${studentId}`);
  }
});

//--------------------------------------------------------------------------------------------------------------------

app.get("/item/:id", async (req, res) => {
  const itemId = req.params.id;

  let db21Result = null;
  let db22Result = null;

  try {
    db21Result = await axios.get(
      `https://${DB21}/lab1_item/_doc/${itemId}`,
      apiHeader(DB21_API_KEY)
    );
  } catch (err) {}

  try {
    db22Result = await axios.get(
      `https://${DB22}/lab1_item/_doc/${itemId}`,
      apiHeader(DB22_API_KEY)
    );
  } catch (err) {}

  const finalResult = mergeResults(db21Result, db22Result);

  if (Object.keys(finalResult).length) {
    res.status(200);
    res.send(finalResult);
  } else {
    res.status(404);
    res.send("Not Found");
  }
});

app.post("/item", async (req, res) => {
  const { itemId, fk_library, name, description, borrow_time, type } = req.body;

  let isBook = true;

  if (type === "magazine") {
    isBook = false;
  }

  const db2ToUse = isBook ? DB22 : DB21;
  const db2ToUseHeaders = isBook
    ? apiHeader(DB22_API_KEY)
    : apiHeader(DB21_API_KEY);
  try {
    result = await axios.post(
      `https://${db2ToUse}/lab1_item/_doc/${itemId}`,
      {
        fk_library,
        name,
        description,
        borrow_time,
        type,
      },
      db2ToUseHeaders
    );
  } catch (err) {
    console.log(err);
    res.status(err.response.status);
    res.send(err.response.statusText);
    return;
  }

  res.status(200);
  res.send("Created");
});

app.put("/item/:id", async (req, res) => {
  let itemId = req.params.id;
  const { fk_library, name, description, borrow_time, type } = req.body;

  let isBook = true;

  if (type === "magazine") {
    isBook = false;
  }

  const db2ToUse = isBook ? DB22 : DB21;
  const db2ToUseHeaders = isBook
    ? apiHeader(DB22_API_KEY)
    : apiHeader(DB21_API_KEY);

  try {
    result = await axios.post(
      `https://${db2ToUse}/lab1_item/_update/${itemId}`,
      {
        doc: {
          fk_library, name, description, borrow_time, type
        },
      },
      db2ToUseHeaders
    );

  } catch (err) {
    console.log(err);
    res.status(err.response.status);
    res.send(err.response.statusText);
    return;
  }

  res.status(200);
  res.send("Updated");
});

app.delete("/item/:id", async (req, res) => {
  const itemId = req.params.id;
  let db21err = false;
  let db22err = false;

  try {
    await axios.delete(
      `https://${DB21}/lab1_item/_doc/${itemId}`,
      apiHeader(DB21_API_KEY)
    );
  } catch (err) {
    db21err = true;
  }

  try {
    await axios.delete(
      `https://${DB22}/lab1_item/_doc/${itemId}`,
      apiHeader(DB22_API_KEY)
    );
  } catch (err) {
    db22err = true;
  }

  if (!db21err || !db22err) {
    res.status(200);
    res.send("Deleted");
  } else {
    res.status(400);
    res.send(`No item with id: ${itemId}`);
  }
});

app.listen(port, () => console.log(`App listening on port ${port}`));
