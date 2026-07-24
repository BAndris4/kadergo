import { FopData, CreateFopFormState } from "../types/fop";

export const INITIAL_FOPS: FopData[] = [];

export const INITIAL_FORM_STATE: CreateFopFormState = {
  vezeteknev: "",
  keresztnev: "",
  apai_nev: "",
  kod: "",
  szuletesi_datum: "",
  nem: "",

  fop_kod: "",
  fop_kezdete_datum: "",

  iranyitoszam: "",
  megye: "",
  jaras: "",
  kozseg: "",
  utca: "",
  hazszam: "",
  epulet: "",
  lakas_szoba: "",
  orszag: "Україна",

  okmany_tipus: 0,
  szeria: "",
  okmanyszam: "",
  kiallitott_hatosag: "",
  hatosagi_kod: "",
  kiallitasi_datum: "",
  lejarati_datum: "",
};
