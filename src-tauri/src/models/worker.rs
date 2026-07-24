use serde::{Deserialize, Serialize};
use super::common::{CimInput, OkmanyInput};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWorkerInput {
    pub fop_id: i64,
    pub kod: Option<String>,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: String,
    pub szuletesi_datum: Option<String>,
    pub nem: Option<String>,

    pub foglalkozas_megnevezes: String,
    pub fizetes: f64,
    pub foallas: bool,
    pub teljes_munkaido: bool,
    pub munkakezdes_datum: Option<String>,
    pub kerelem_datum: Option<String>,
    pub munkaviszony_vege: Option<String>,

    pub cim: Option<CimInput>,
    pub okmany: Option<OkmanyInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateWorkerInput {
    pub id: i64, // jogviszony_id
    pub kod: Option<String>,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: String,
    pub szuletesi_datum: Option<String>,
    pub nem: Option<String>,

    pub foglalkozas_megnevezes: String,
    pub fizetes: f64,
    pub foallas: bool,
    pub teljes_munkaido: bool,
    pub munkakezdes_datum: Option<String>,
    pub kerelem_datum: Option<String>,
    pub munkaviszony_vege: Option<String>,

    pub cim: Option<CimInput>,
    pub okmany: Option<OkmanyInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MunkasDto {
    pub id: i64,
    pub kod: String,
    pub vezeteknev: String,
    pub keresztnev: String,
    pub apai_nev: Option<String>,
    pub szuletesi_datum: Option<String>,
    pub nem: Option<String>,
    pub foallas: bool,
    pub teljes_munkaido: bool,
    pub foglalkozas_megnevezes: String,
    pub fizetes: f64,
    pub munkakezdes_datum: Option<String>,
    pub kerelem_datum: Option<String>,
    pub munkaviszony_vege: Option<String>,
    pub cim: Option<CimInput>,
    pub okmany: Option<OkmanyInput>,
}
