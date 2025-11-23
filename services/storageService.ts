
import { Contact, Deal, SalesRep } from "../types";
import { MOCK_CONTACTS, MOCK_DEALS, MOCK_SALES_REPS } from "../constants";

// 로컬 개발 환경 여부 확인
const isLocal = !window.google || !window.google.script;
const STORAGE_KEY = 'ieg_crm_data_v11'; // Version bump to v11 to force fresh data load and remove "Unrated"

export const loadInitialData = (): Promise<{ contacts: Contact[], deals: Deal[], salesReps: SalesRep[] }> => {
  return new Promise((resolve, reject) => {
    if (isLocal) {
      console.log("Running in Local Mode: Loading Mock Data");
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        try {
            const parsed = JSON.parse(localData);
            resolve({
                contacts: parsed.contacts || MOCK_CONTACTS,
                deals: parsed.deals || MOCK_DEALS,
                salesReps: parsed.salesReps || MOCK_SALES_REPS
            });
        } catch(e) {
            console.warn("Corrupt local data, loading mocks");
            resolve({ contacts: MOCK_CONTACTS, deals: MOCK_DEALS, salesReps: MOCK_SALES_REPS });
        }
      } else {
        // First run or version change: Use fresh mocks
        console.log("New version detected, initializing with fresh mock data.");
        // Save immediately to persist the fresh data
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ contacts: MOCK_CONTACTS, deals: MOCK_DEALS, salesReps: MOCK_SALES_REPS }));
        resolve({ contacts: MOCK_CONTACTS, deals: MOCK_DEALS, salesReps: MOCK_SALES_REPS });
      }
      return;
    }

    window.google!.script.run
      .withSuccessHandler((response: string) => {
        try {
          const parsed = JSON.parse(response);
          // If Sheet is empty, return Mocks
          if ((!parsed.contacts || parsed.contacts.length === 0) && (!parsed.deals || parsed.deals.length === 0)) {
               resolve({ contacts: MOCK_CONTACTS, deals: MOCK_DEALS, salesReps: MOCK_SALES_REPS });
          } else {
               resolve({
                  contacts: parsed.contacts || [],
                  deals: parsed.deals || [],
                  salesReps: parsed.salesReps || []
               });
          }
        } catch (e) {
          console.error("Failed to parse GAS response", e);
          resolve({ contacts: [], deals: [], salesReps: [] });
        }
      })
      .withFailureHandler((error: Error) => {
        console.error("GAS Error:", error);
        reject(error);
      })
      .getCRMData();
  });
};

export const saveDataToSheet = (contacts: Contact[], deals: Deal[], salesReps: SalesRep[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (isLocal) {
            console.log("Local Mode: Saving to LocalStorage");
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ contacts, deals, salesReps }));
            resolve();
            return;
        }

        window.google!.script.run
            .withSuccessHandler(() => {
                window.google!.script.run
                    .withSuccessHandler(() => {
                        window.google!.script.run
                            .withSuccessHandler(() => resolve())
                            .withFailureHandler((e: Error) => reject(e))
                            .saveCRMData('salesReps', JSON.stringify(salesReps));
                    })
                    .withFailureHandler((e: Error) => reject(e))
                    .saveCRMData('deals', JSON.stringify(deals));
            })
            .withFailureHandler((e: Error) => reject(e))
            .saveCRMData('contacts', JSON.stringify(contacts));
    });
}

export const sendReportEmail = (email: string, subject: string, body: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if(isLocal) {
            console.log(`[Local Mock] Sending Email to ${email}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${body}`);
            resolve();
            return;
        }

        window.google!.script.run
            .withSuccessHandler(() => resolve())
            .withFailureHandler((e: Error) => reject(e))
            .sendEmail(email, subject, body);
    });
}

export const syncSheetData = (): Promise<{ contacts: Contact[], deals: Deal[], salesReps: SalesRep[] }> => {
    return loadInitialData();
}

export const resetToSampleData = (): Promise<void> => {
    return new Promise((resolve) => {
        if(isLocal) {
            localStorage.removeItem(STORAGE_KEY);
        }
        resolve();
    });
}
