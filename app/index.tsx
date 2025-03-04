import React, { useState, useEffect,useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { database } from './database/db';
import Client from './database/models/client';
import { syncDatabase } from './database/sync';

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rate, setRate] = useState('');
  const [job, setJob] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);

  const isFirstLoad = useRef(true);


  useEffect(() => {   
    loadClients();
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;
      setIsOnline(isNowOnline);
      
      if (wasOffline && isNowOnline) {
        manualSync();
      }

      setIsOnline(isNowOnline);
    });

    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
      isFirstLoad.current = false;
    });
    return () => unsubscribe();
  }, [isOnline]);

  const performSilentSync = async () => {
    if (!isOnline) return;
    
    try {
      setIsSyncing(true);
      await syncDatabase();
      await loadClients();
    } catch (error) {
      console.error('Silent sync error:', error);
      Alert.alert('Sync Failed', 'Changes will sync when connection improves');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsCollection = database.collections.get('clients');
      const loadedClients = await clientsCollection.query().fetch() as Client[];
      setClients(loadedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setJob('');
    setRate('');
    setEditingClient(null);
  };

  const startEditing = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setJob(client.job || '');
    setRate(client.rate || '');
  };

  const manualSync = async () => {
    // if (!isOnline) {
    //   Alert.alert('Offline', 'Please check your internet connection and try again');
    //   return;
    // }

    try {
      setShowSyncOverlay(true);
      await syncDatabase();
      await loadClients();
      Alert.alert('success', 'Sync Completed');
    } catch (error) {
      console.error('Manual sync error:', error);
      Alert.alert('Sync Error', 'Failed to sync with server. Please try again.');
    } finally {
      setShowSyncOverlay(false);
    }
  };

  const addClient = async () => {
    const clientsCollection = database.collections.get<Client>('clients');
    try {
      await database.write(async () => {
        await clientsCollection.create((client) => {
          client.name = name;
          client.email = email;
          client.job = job;
          client.rate = rate;
          client.is_active = true;
          client.custom_sync_status = 'created';
          client.version = 1;
          client.created_at = Date.now();
          client.updated_at = Date.now();
        });
      });
      
      Alert.alert('Success', 'Client added successfully');
      resetForm();
      await loadClients();
      performSilentSync();
    } catch (error) {
      console.error("Error adding client:", error);
      Alert.alert('Error', 'Failed to add client');
    }
  };

  const updateClient = async () => {
    if (!editingClient) return;

    try {
      await database.write(async () => {
        await editingClient.update(client => {
          client.name = name;
          client.email = email;
          client.job = job;
          client.rate = rate;
          client.custom_sync_status = 'updated';
          client.version += 1;
          client.updated_at = Date.now();
        });
      });

      Alert.alert('Success', 'Client updated successfully');
      resetForm();
      await loadClients();
      performSilentSync();
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert('Error', 'Failed to update client');
    }
  };

  const deleteClient = async (client: Client) => {
    Alert.alert(
      "Delete Client",
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.write(async () => {
                await client.update((record) => {
                  record.custom_sync_status = 'deleted';
                  record.deleted_at = Date.now();
                });
                await client.markAsDeleted();
              });
              
              Alert.alert('Success', 'Client deleted successfully');
              await loadClients();
              performSilentSync();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('Error', 'Failed to delete client');
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (editingClient) {
      await updateClient();
    } else {
      await addClient();
    }
  };

  const renderOverlayLoader = () => {
    if (showSyncOverlay) {
      return (
        <View style={styles.overlayContainer}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loaderText}>Syncing data...</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText,
          isOnline ? styles.onlineText : styles.offlineText
        ]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      {renderOverlayLoader()}

      <Text style={styles.title}>Offline-First User Management</Text>
      <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName}/>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail}/>
      <TextInput placeholder="Job" style={styles.input} value={job} onChangeText={setJob}/>
      <TextInput placeholder="Rate" style={styles.input} value={rate} onChangeText={setRate}/>
      
      <View style={styles.buttonContainer}>
        <Button title={editingClient ? "Update User" : "Add User"} onPress={handleSubmit} />
        {editingClient && (
          <Button title="Cancel Edit" onPress={resetForm} color="gray"/>
        )}
      </View>
      <View style={styles.syncContainer}>
        <Text style={styles.subTitle}>Clients List</Text>
        <Button title="Sync Now" onPress={manualSync} disabled={!isOnline}/>
      </View>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.client}>
            <Text>Id: {item.id}</Text>
            <Text>Name: {item.name}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Job: {item.job}</Text>
            <Text>Rate: {item.rate}</Text>
            <Text>Updated: {new Date(item.updated_at).toLocaleString()}</Text>
            <View style={styles.clientButtons}>
              <Button title="Edit" color="green" onPress={() => startEditing(item)}/>
              <Button title="Delete" color="red" onPress={() => deleteClient(item)}/>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No clients found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1,padding: 20,backgroundColor: '#fff'},
  statusContainer: {position: 'absolute',top: 10,right: 10,zIndex: 1000,padding: 5,borderRadius: 5,},
  statusText: {fontWeight: 'bold',paddingHorizontal: 10,paddingVertical: 5,borderRadius: 5,},
  onlineText: {backgroundColor: '#4CAF50',color: 'white',},
  offlineText: {backgroundColor: '#f44336',color: 'white',},
  title: {fontSize: 20,fontWeight: 'bold',marginBottom: 20,marginTop: 40},
  subTitle: {fontSize: 18,fontWeight: '600',},
  input: {borderWidth: 1,borderColor: '#ccc',padding: 10,marginBottom: 10,borderRadius: 5},
  buttonContainer: {flexDirection: 'row',justifyContent: 'space-between',marginBottom: 10},
  syncContainer: {flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',marginVertical: 10,},
  client: {marginBottom: 15,padding: 15,borderColor: '#ddd',borderWidth: 1,borderRadius: 8,backgroundColor: '#f9f9f9'},
  clientButtons: {flexDirection: 'row',justifyContent: 'space-around',marginTop: 10,},
  overlayContainer: {position: 'absolute',top: 0,left: 0,right: 0,bottom: 0,backgroundColor: 'rgba(0, 0, 0, 0.5)',justifyContent: 'center',alignItems: 'center',zIndex: 1000,},
  loaderCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loaderText: {marginLeft: 10,fontSize: 16,color: '#0000ff',fontWeight: '600',}
});