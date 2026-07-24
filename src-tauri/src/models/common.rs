use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CimInput {
    pub iranyitoszam: Option<String>,
    pub megye: Option<String>,
    pub jaras: Option<String>,
    pub kozseg: Option<String>,
    pub utca: Option<String>,
    pub hazszam: Option<String>,
    pub epulet: Option<String>,
    pub lakas_szoba: Option<String>,
    pub orszag: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OkmanyInput {
    pub tipus: i32, // 0: старий (паспорт-книжечка), 1: новий (ID-картка)
    pub szeria: Option<String>,
    pub okmanyszam: String,
    pub kiallitott_hatosag: Option<String>,
    pub hatosagi_kod: Option<String>,
    pub kiallitasi_datum: Option<String>,
    pub lejarati_datum: Option<String>,
}
