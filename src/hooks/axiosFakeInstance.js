//GET ALL
export const getDataAll = (key) => {
  return new Promise((resolve, reject) => {
    const data = localStorage.getItem(key);
    if (data) {
      resolve(JSON.parse(data));
    } else {
      reject("No data found for key: " + key);
    }
  });
};

//GET Profile for account
export const getProfileForCustomerCloud = (orgId, custId, cloudId) => {
  return new Promise((resolve, reject) => {
    try {
      const orgData = JSON.parse(localStorage.getItem("organizations")) || [];
      const profileData = JSON.parse(localStorage.getItem("profiles")) || [];

      const org = orgData.find((o) => o.id === orgId);
      if (!org)
        return reject(new Error(`Organization with id ${orgId} not found`));

      const customer = (org.customer || []).find((c) => c.id === custId);
      if (!customer)
        return reject(
          new Error(
            `Customer with id ${custId} not found in organization ${orgId}`
          )
        );

      const cloud = (customer.cloudAccount || []).find((c) => c.id === cloudId);
      if (!cloud)
        return reject(
          new Error(
            `Cloud account with id ${cloudId} not found in customer ${custId}`
          )
        );

      if (!Array.isArray(cloud.profile) || cloud.profile.length === 0) {
        return resolve([]); // No profiles found
      }

      const result = cloud.profile.map((p) => {
        const profileDetails = profileData.find((pd) => pd.id === p.id);
        return {
          id: p.id,
          fullName: profileDetails?.fullName || "Unknown",
          permission: profileDetails?.permission || "Unknown",
          accessLevel: p.access, // from cloud.profile object
        };
      });

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

//UPDATE Profile in Org - only update access level
export const updateProfileAccessLevel = (
  orgId,
  custId,
  cloudId,
  profileId,
  newAccessLevel
) => {
  return new Promise((resolve, reject) => {
    try {
      const key = "organizations"; // <-- Hardcoded storage key
      const orgData = JSON.parse(localStorage.getItem(key)) || [];

      const org = orgData.find((o) => o.id === orgId);
      if (!org)
        return reject(new Error(`Organization with id ${orgId} not found`));

      const customer = (org.customer || []).find((c) => c.id === custId);
      if (!customer)
        return reject(new Error(`Customer with id ${custId} not found`));

      const cloud = (customer.cloudAccount || []).find((c) => c.id === cloudId);
      if (!cloud)
        return reject(new Error(`Cloud account with id ${cloudId} not found`));

      const profile = (cloud.profile || []).find((p) => p.id === profileId);
      if (!profile)
        return reject(new Error(`Profile with id ${profileId} not found`));

      // Update access level
      profile.access = newAccessLevel;

      // Save updated data
      localStorage.setItem(key, JSON.stringify(orgData));

      resolve({
        id: profile.id,
        access: profile.access,
      });
    } catch (error) {
      reject(error);
    }
  });
};

//DELETE PROFILE FROM CUSTOMER ASSOCIATION
export const deleteProfileFromCustomer = (
  orgId,
  custId,
  cloudId,
  profileId
) => {
  return new Promise((resolve, reject) => {
    try {
      const key = "organizations"; // LocalStorage key
      const orgData = JSON.parse(localStorage.getItem(key)) || [];

      const org = orgData.find((o) => o.id === orgId);
      if (!org)
        return reject(new Error(`Organization with id ${orgId} not found`));

      const customer = (org.customer || []).find((c) => c.id === custId);
      if (!customer)
        return reject(new Error(`Customer with id ${custId} not found`));

      const cloud = (customer.cloudAccount || []).find((c) => c.id === cloudId);
      if (!cloud)
        return reject(new Error(`Cloud account with id ${cloudId} not found`));

      const originalLength = (cloud.profile || []).length;
      cloud.profile = (cloud.profile || []).filter((p) => p.id !== profileId);

      if (cloud.profile.length === originalLength) {
        return reject(new Error(`Profile with id ${profileId} not found`));
      }

      // Save back updated data
      localStorage.setItem(key, JSON.stringify(orgData));

      resolve({ message: `Profile with id ${profileId} deleted.` });
    } catch (error) {
      reject(error);
    }
  });
};

//GET BY ID and text
// src/hooks/axiosFakeInstance.js
export const getItemByIdByText = (
  key,
  id = null,
  field = null,
  value = null
) => {
  return new Promise((resolve, reject) => {
    const data = localStorage.getItem(key);
    if (!data) {
      reject({ error: "No data found for key: " + key });
      return;
    }

    let parsedData = JSON.parse(data);

    // 🔥 If key is "organization" and parsedData is NOT an array, wrap it
    if (key === "organizations" && !Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    let result = parsedData;

    if (id !== null) {
      result = result.filter((item) => item.id === id);
    }

    if (field && value !== null) {
      result = result.filter((item) => {
        if (item[field]) {
          const fieldValue = item[field].toString().toLowerCase();
          const searchValue = value.toString().toLowerCase();
          return fieldValue.includes(searchValue) || fieldValue === searchValue;
        }
        return false;
      });
    }

    resolve({ data: result });
  });
};

//Get data from Header object
export const getDataByIdByText = (
  key,
  id = null,
  field = null,
  value = null
) => {
  return new Promise((resolve, reject) => {
    const data = localStorage.getItem(key);
    if (!data) {
      reject("No data found for key: " + key);
      return;
    }

    let parsedData = JSON.parse(data);

    // Normalize if organizations object instead of array
    if (key === "organizations" && !Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    let result = parsedData;

    // All parameters null → return all data
    if (id === null && field === null && value === null) {
      resolve(result);
      return;
    }

    // Filter by ID
    if (id !== null) {
      result = result.filter((item) => item.id === id);
    }

    // Filter by field + value
    if (field && value !== null) {
      const searchValue = value.toString().toLowerCase();
      result = result.filter((item) => {
        const fieldValue = item[field]?.toString().toLowerCase();
        return fieldValue?.includes(searchValue) || fieldValue === searchValue;
      });
    }

    resolve(result);
  });
};

//update
export const updateDataById = (key, id, updatedObject) => {
  return new Promise((resolve, reject) => {
    const data = localStorage.getItem(key);
    if (!data) {
      reject("No data found for key: " + key);
      return;
    }

    let parsedData = JSON.parse(data);

    // Normalize if organizations object instead of array
    if (key === "organizations" && !Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    const index = parsedData.findIndex((item) => item.id === id);
    if (index === -1) {
      reject(`No item found with id: ${id}`);
      return;
    }

    // Update the item
    parsedData[index] = { ...parsedData[index], ...updatedObject };
    localStorage.setItem(key, JSON.stringify(parsedData));

    resolve(parsedData[index]);
  });
};

// export const getDataByIdByText = (
//   key,
//   id = null,
//   field = null,
//   value = null
// ) => {
//   return new Promise((resolve, reject) => {
//     const data = localStorage.getItem(key);
//     if (!data) {
//       reject({ error: "No data found for key: " + key });
//       return;
//     }

//     let parsedData = JSON.parse(data);

//     // Normalize structure if needed
//     if (key === "organizations" && !Array.isArray(parsedData)) {
//       parsedData = [parsedData];
//     }

//     // All parameters null → return everything
//     if (id === null && field === null && value === null) {
//       resolve({ data: parsedData });
//       return;
//     }

//     // Search by ID
//     if (id !== null) {
//       const found = parsedData.find((item) => item.id === id);
//       resolve({ data: found || null });
//       return;
//     }

//     // Search by field and value
//     if (field && value !== null) {
//       const found = parsedData.find((item) => {
//         if (item[field]) {
//           const fieldValue = item[field].toString().toLowerCase();
//           const searchValue = value.toString().toLowerCase();
//           return fieldValue.includes(searchValue) || fieldValue === searchValue;
//         }
//         return false;
//       });

//       resolve({ data: found || null });
//       return;
//     }

//     // Default fallback
//     resolve({ data: null });
//   });
// };

//POST
export const postAddSingleItem = (key, newItem, field) => {
  return new Promise((resolve, reject) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(key)) || [];

      // 🔍 Check for duplicate based on dynamic field (e.g. item[field])
      const valueExists = existingData.some(
        (item) =>
          item[field]?.toLowerCase?.() === newItem[field]?.toLowerCase?.()
      );

      if (valueExists) {
        return reject(
          new Error(`Item with ${field} "${newItem[field]}" already exists.`)
        );
      }

      const updatedData = [...existingData, newItem];
      localStorage.setItem(key, JSON.stringify(updatedData));
      resolve(updatedData);
    } catch (error) {
      reject(error);
    }
  });
};

//POST ON ORGANIZATION
// POST to update customer section for a specific organization
export const postUpdateOrg = (key, orgId, newCustomer) => {
  return new Promise((resolve, reject) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(key)) || [];

      // Check if org exists
      const orgIndex = existingData.findIndex((org) => org.id === orgId);
      if (orgIndex === -1) {
        return reject(new Error(`Organization with id ${orgId} not found`));
      }

      const org = existingData[orgIndex];

      // Check if org name already exists under a different orgId
      const duplicateOrgName = existingData.some(
        (o) => o.name.toLowerCase() === org.name.toLowerCase() && o.id !== orgId
      );
      if (duplicateOrgName) {
        return reject(
          new Error(
            `Organization name '${org.name}' already exists for a different ID.`
          )
        );
      }

      // Check for duplicate customer name in the same organization
      const customerExists = (org.customer || []).some(
        (cust) => cust.name.toLowerCase() === newCustomer.name.toLowerCase()
      );
      if (customerExists) {
        return reject(
          new Error(
            `Customer name '${newCustomer.name}' already exists in organization '${org.name}'.`
          )
        );
      }

      // Check for duplicate cloudAccount ID in all existing customers of this org
      const existingCloudAccountIds = new Set();
      for (const cust of org.customer || []) {
        for (const acc of cust.cloudAccount || []) {
          existingCloudAccountIds.add(acc.id);
        }
      }

      for (const acc of newCustomer.cloudAccount || []) {
        if (existingCloudAccountIds.has(acc.id)) {
          return reject(
            new Error(
              `Cloud account ID '${acc.id}' already exists in organization '${org.name}'.`
            )
          );
        }
      }

      // All checks passed, add new customer
      org.customer = [...(org.customer || []), newCustomer];
      existingData[orgIndex] = org;

      // Save back to localStorage
      localStorage.setItem(key, JSON.stringify(existingData));

      resolve([org]); // return updated org
    } catch (error) {
      reject(error);
    }
  });
};

//POD ADD PROFILE TO CUSTOMER ASSOCIATION
export const postAddProfileToCustomerCloud = (
  key,
  orgId,
  custId,
  cloudId,
  profileId,
  access
) => {
  return new Promise((resolve, reject) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(key)) || [];

      // Find organization
      const orgIndex = existingData.findIndex((org) => org.id === orgId);
      if (orgIndex === -1) {
        return reject(new Error(`Organization with id ${orgId} not found`));
      }

      const org = existingData[orgIndex];

      // Find customer
      const custIndex = (org.customer || []).findIndex(
        (cust) => cust.id === custId
      );
      if (custIndex === -1) {
        return reject(
          new Error(
            `Customer with id ${custId} not found in organization ${orgId}`
          )
        );
      }

      const customer = org.customer[custIndex];

      // Find cloud account
      const cloudIndex = (customer.cloudAccount || []).findIndex(
        (acc) => acc.id === cloudId
      );
      if (cloudIndex === -1) {
        return reject(
          new Error(
            `Cloud account with id ${cloudId} not found in customer ${custId}`
          )
        );
      }

      const cloud = customer.cloudAccount[cloudIndex];

      // Ensure profile array exists
      if (!Array.isArray(cloud.profile)) {
        cloud.profile = [];
      }

      // Check if profile already exists
      const profileExists = cloud.profile.some((p) => p.id === profileId);
      if (profileExists) {
        return reject(
          new Error(
            `Profile with id ${profileId} already exists in cloud account ${cloudId}`
          )
        );
      }

      // Add profile
      cloud.profile.push({
        id: profileId,
        access: access,
      });

      // Save updated structure
      existingData[orgIndex].customer[custIndex].cloudAccount[cloudIndex] =
        cloud;
      localStorage.setItem(key, JSON.stringify(existingData));

      resolve([existingData[orgIndex]]); // Return updated org
    } catch (error) {
      reject(error);
    }
  });
};

//POST ON ORGANIZATION - to add organization and customer relation
export const postAddOrg = (key, newOrg) => {
  return new Promise((resolve, reject) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(key)) || [];

      // 🔍 Check for duplicate org name
      const orgNameExists = existingData.some(
        (org) => org.name.toLowerCase() === newOrg.name.toLowerCase()
      );
      if (orgNameExists) {
        return reject(
          new Error(`Organization name '${newOrg.name}' already exists.`)
        );
      }

      //create org master record
      const orgMaster = {
        id: newOrg.id,
        name: newOrg.name,
      };

      let proceed = true;
      postAddSingleItem("orgMaster", orgMaster)
        .then((response) => {
          console.log("Organization master record added:", response);
        })
        .catch((error) => {
          console.error("Error adding organization master record:", error);
          proceed = false;
        });

      if (proceed) {
        // 🔍 Check for duplicate customer names
        for (const org of existingData) {
          const existingCustomerNames = new Set(
            (org.customer || []).map((cust) => cust.name.toLowerCase())
          );
          for (const cust of newOrg.customer || []) {
            if (existingCustomerNames.has(cust.name.toLowerCase())) {
              return reject(
                new Error(
                  `Customer name '${cust.name}' already exists in another organization.`
                )
              );
            }

            // 🔍 Check for duplicate cloud account IDs
            const existingCloudAccountIds = new Set();
            for (const existingCust of org.customer || []) {
              for (const acc of existingCust.cloudAccount || []) {
                existingCloudAccountIds.add(acc.id);
              }
            }
            for (const acc of cust.cloudAccount || []) {
              if (existingCloudAccountIds.has(acc.id)) {
                return reject(
                  new Error(
                    `Cloud account ID '${acc.id}' already exists in another organization.`
                  )
                );
              }
            }
          }
        }

        // ✅ All checks passed, add the new organization
        existingData.push(newOrg);
        localStorage.setItem(key, JSON.stringify(existingData));
        resolve(existingData);
      }
    } catch (error) {
      reject(error);
    }
  });
};

//DELETE customer from Org
export const deleteCustFromOrg = (key, organizationId, customerId) => {
  return new Promise((resolve, reject) => {
    try {
      if (key !== "organizations") {
        reject(
          new Error("Invalid key: operation only allowed for 'organizations'")
        );
        return;
      }

      const existingData = JSON.parse(localStorage.getItem(key)) || [];

      let updatedOrg = null;

      const updatedData = existingData.map((org) => {
        if (org.id === organizationId) {
          const updatedCustomers = Array.isArray(org.customer)
            ? org.customer.filter((cust) => cust.id !== customerId)
            : [];

          updatedOrg = { ...org, customer: updatedCustomers };
          return updatedOrg;
        }
        return org;
      });

      localStorage.setItem(key, JSON.stringify(updatedData));

      if (updatedOrg) {
        resolve(updatedOrg); // ✅ Only return the updated org
      } else {
        reject(new Error(`Organization with id ${organizationId} not found.`));
      }
    } catch (error) {
      reject(error);
    }
  });
};

//UPDATE / PUT
export const updateInLocalStorage = (key, updatedItem) => {
  return new Promise((resolve, reject) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(key)) || [];
      const index = existingData.findIndex(
        (item) => item.id === updatedItem.id
      );

      if (index !== -1) {
        existingData[index] = { ...existingData[index], ...updatedItem };
        localStorage.setItem(key, JSON.stringify(existingData));
        resolve(existingData);
      } else {
        reject(new Error("Item not found"));
      }
    } catch (error) {
      reject(error);
    }
  });
};
