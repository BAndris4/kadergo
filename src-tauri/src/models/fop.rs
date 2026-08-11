use serde::{Deserialize, Serialize};
use super::common::{CimInput, OkmanyInput};
use super::worker::MunkasDto;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFopInput {
    pub kod: Option<String>,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: String,
    pub szuletesi_datum: Option<String>,
    pub nem: Option<String>, // 'Чоловік' | 'Жінка'
    pub fop_kod: Option<String>,
    pub fop_kezdete_datum: Option<String>,
    pub cim: Option<CimInput>,
    pub okmany: Option<OkmanyInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFopInput {
    pub id: i64,
    pub kod: Option<String>,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: String,
    pub szuletesi_datum: Option<String>,
    pub nem: Option<String>, // 'Чоловік' | 'Жінка'
    pub fop_kod: Option<String>,
    pub fop_kezdete_datum: Option<String>,
    pub nakaz_szam: Option<String>,
    pub munkas_szam: Option<String>,
    pub cim: Option<CimInput>,
    pub okmany: Option<OkmanyInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FopDto {
    pub id: i64,
    pub kod: Option<String>,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: Option<String>,
    pub szuletesi_datum: Option<String>,
    pub nem: Option<String>,
    pub fop_kod: Option<String>,
    pub fop_kezdete_datum: Option<String>,
    pub nakaz_szam: Option<String>,
    pub munkas_szam: Option<String>,
    pub cim: Option<CimInput>,
    pub okmany: Option<OkmanyInput>,
    pub munkasok: Vec<MunkasDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanFopsResult {
    pub total_scanned: usize,
    pub imported_count: usize,
    pub existing_count: usize,
    pub imported_names: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscoveredFopDto {
    pub folder_name: String,
    pub folder_path: String,
    pub kod: String,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: String,
    pub already_exists: bool,
}


