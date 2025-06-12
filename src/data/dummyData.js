// src/data/dummyData.js

import Password from "antd/es/input/Password";

export const dummyOrgMaster = [
  {
    id: 1,
    name: "MSPI1",
  },
  {
    id: 2,
    name: "Deloite",
  },
];
export const dummyOrganizations = [
  {
    id: 1,
    name: "MSPI1",
    customer: [
      {
        id: 1,
        name: "Customer 1",
        cloudAccount: [
          {
            id: 1,
            name: "AWS-001",
            provider: "AWS",
            profile: [
              {
                id: 1,
                access: "Viewer",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Deloite",
    customer: [
      {
        id: 2,
        name: "Customer 2",
        cloudAccount: [
          {
            id: 2,
            name: "AWS-002",
            provider: "AWS",
            profile: [
              {
                id: 2,
                accessLevel: "Approver",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const dummyCustomers = [
  {
    id: 1,
    name: "Customer 1",
  },
  {
    id: 2,
    name: "Customer 2",
  },
  {
    id: 3,
    name: "Customer 3",
  },
  {
    id: 4,
    name: "Customer 4",
  },
  {
    id: 5,
    name: "Customer 5",
  },
  {
    id: 6,
    name: "Customer 6",
  },
];
export const dummyCloudAccounts = [
  {
    id: 1,
    name: "AWS-001",
    provider: "AWS",
  },
  {
    id: 2,
    name: "AWS-002",
    provider: "AWS",
  },
  {
    id: 3,
    name: "Azure-001",
    provider: "Azure",
  },
  {
    id: 4,
    name: "Azure-002",
    provider: "Azure",
  },
  {
    id: 5,
    name: "GCP-001",
    provider: "GCP",
  },
  {
    id: 6,
    name: "GCP-002",
    provider: "GCP",
  },
];

export const dummyProfile = [
  {
    id: 1,
    fullName: "Donald Trump",
    email: "m1@mail.com",
    password: "pass1234",
    permission: "root",
    isVerified: true,
    defaultAccount: "AWS1",
    orgId: 1,
    custId: 1,
    cloudId: 1,
  },
  {
    id: 2,
    fullName: "Henry Ford",
    email: "m2@mail.com",
    password: "pass1234",
    permission: "general",
    isVerified: true,
    defaultAccount: "AWS1",
    orgId: 1,
    custId: 1,
    cloudId: 1,
  },
  {
    id: 3,
    fullName: "Mattha Steward",
    email: "m3@mail.com",
    Password: "pass1234",
    permission: "general",
    isVerified: true,
    defaultAccount: "AWS1",
    orgId: 1,
    custId: 1,
    cloudId: 1,
  },
  {
    id: 4,
    fullName: "Derrick James",
    email: "m4@mail.com",
    password: "pass1234",
    permission: "general",
    isVerified: true,
    defaultAccount: "AWS1",
    orgId: 1,
    custId: 1,
    cloudId: 1,
  },
  {
    id: 5,
    fullName: "Matthias Brian",
    email: "m5@mail.com",
    password: "pass1234",
    permission: "general",
    isVerified: true,
    defaultAccount: "AWS1",
    orgId: 1,
    custId: 1,
    cloudId: 1,
  },
  {
    id: 6,
    fullName: "David Joseph",
    email: "m6@mail.com",
    password: "pass1234",
    permission: "general",
    isVerified: true,
    defaultAccount: "AWS1",
    orgId: 1,
    custId: 1,
    cloudId: 1,
  },
];
