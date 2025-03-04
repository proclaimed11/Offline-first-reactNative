import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './db';

export async function syncDatabase() {
  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        try {
            const response = await fetch('http://10.0.2.2:3000/api/sync/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastPulledAt }),
            });          
            if (!response.ok) {
                throw new Error(`Failed to pull changes. Status: ${response.status}`);
            }  
            const data = await response.json();
            console.log('Pull response:', JSON.stringify(data, null, 2));
            
            const clientsData = data.changes.clients_td || [];
            const deletedIds = data.changes.deleted_records || [];
    
            // Log to verify the structure
            console.log('Deleted IDs received:', deletedIds);
    
            const changes = {
                clients: {
                    created: [], 
                    updated: clientsData.map(client => ({
                        id: client.id,
                        name: client.name,
                        email: client.email,
                        job: client.job,
                        rate: client.rate,
                        is_active: client.isactive,
                        custom_sync_status: 'synced',
                        version: client.version,
                        updated_at: new Date(client.updated_at).getTime(),
                        created_at: new Date(client.created_at).getTime(),
                        deleted_at: client.deleted_at ? new Date(client.deleted_at).getTime() : null
                    })),
                    // Extract just the ID string since WatermelonDB expects an array of ID strings
                    deleted: deletedIds.map(record => record.id)
                }
            };    
            console.log('Processed changes:', JSON.stringify(changes, null, 2));
            
            return {
                changes,
                timestamp: data.timestamp
            };
        } catch (error) {
            console.error('Error during pullChanges:', error);
            throw error;
        }
    },   
      pushChanges: async ({ changes, lastPulledAt }) => {
        try {
          const created = changes.clients?.created || [];
          const updated = changes.clients?.updated || [];
          const deleted = changes.clients?.deleted || [];

          // Handle both created and updated records uniformly
          const transformedChanges = {
            clients_td: [
              ...created.map(client => ({
                id: client.id,
                name: client.name,
                email: client.email,
                job: client.job,
                rate: client.rate,
                isactive: client.is_active,
                sync_status: 'updated', // Change this to 'updated' instead of 'created'
                version: client.version || 1,
                updated_at: new Date(client.updated_at).toISOString(),
                created_at: new Date(client.created_at).toISOString(),
                deleted_at: null
              })),
              ...updated.map(client => ({
                id: client.id,
                name: client.name,
                email: client.email,
                job: client.job,
                rate: client.rate,
                isactive: client.is_active,
                sync_status: 'updated',
                version: client.version || 1,
                updated_at: new Date(client.updated_at).toISOString(),
                created_at: new Date(client.created_at).toISOString(),
                deleted_at: null
              })),
              ...deleted.map(id => ({
                id,
                sync_status: 'deleted',
                deleted_at: new Date().toISOString()
              }))
            ]
          };

          console.log('Pushing changes:', JSON.stringify(transformedChanges, null, 2));
          
          const response = await fetch('http://10.0.2.2:3000/api/sync/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              changes: transformedChanges,
              lastPulledAt // Include lastPulledAt in the push request
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
              console.log('Sync conflict detected:', errorData);
            }
            throw new Error(`Failed to push changes. Status: ${response.status}`);
          }
          console.log('Push successful');
        } catch (error) {
          console.error('Error during pushChanges:', error);
          throw error;
        }
      },
      migrationsEnabledAtVersion: 3,
      sendCreatedAsUpdated: true,
      _unsafeBatchPerCollection: false // Changed this to false to be safer
    });   
    console.log('Synchronization completed successfully.');
    return true;
  } catch (error) {
    console.error('Synchronization error:', error);
    throw error;
  }
}
