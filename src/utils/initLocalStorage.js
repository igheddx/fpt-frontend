// src/utils/initLocalStorage.js

import {
  dummyOrganizations,
  dummyCloudAccounts,
  dummyProfile,
  dummyCustomers,
  dummyOrgMaster,
} from "../data/dummyData";

export const initializeLocalStorage = () => {
  if (!localStorage.getItem("orgMaster")) {
    localStorage.setItem("orgMaster", JSON.stringify(dummyOrgMaster));
  }

  if (!localStorage.getItem("organizations")) {
    localStorage.setItem("organizations", JSON.stringify(dummyOrganizations));
  }

  if (!localStorage.getItem("customers")) {
    localStorage.setItem("customers", JSON.stringify(dummyCustomers));
  }

  if (!localStorage.getItem("cloudAccounts")) {
    localStorage.setItem("cloudAccounts", JSON.stringify(dummyCloudAccounts));
  }

  if (!localStorage.getItem("profiles")) {
    localStorage.setItem("profiles", JSON.stringify(dummyProfile));
  }
};

export const resetLocalStorage = () => {
  localStorage.clear();
  initializeLocalStorage();
};
