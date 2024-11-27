import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type Order = {
  id: number | string;
  paymentId: string;
  stat: string;
  address?: string;
  phone?: string;
  username?: string;
  delivery_assignment?: string;
  totalOrderAmount?: string;
  notes?: string;
};

const OrderStatus: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [username, setUsername] = useState<string>('');
  const [errorLog, setErrorLog] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'To Pick Up' | 'To Ship' | 'Cancelled' | 'Delivered' | 'Completed'>('To Pick Up');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, activeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setErrorLog('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }
  
    try {
      // Fetch user data
      const userResponse = await axios.get('https://deserving-action-5569f72002.strapiapp.com/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (userResponse.data && userResponse.data.username) {
        setUsername(userResponse.data.username);
      } else {
        setErrorLog('No user data found');
      }
  
      // Fetch all orders
      const ordersResponse = await axios.get('https://deserving-action-5569f72002.strapiapp.com/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (ordersResponse.data && Array.isArray(ordersResponse.data.data)) {
        const mappedOrders: Order[] = ordersResponse.data.data.map((order: any) => ({
          id: order.id,
          paymentId: order.attributes?.paymentId || 'Unknown',
          stat: order.attributes?.status || 'Unknown',
          address: order.attributes?.address || 'Unknown',
          phone: order.attributes?.phone || 'Unknown',
          username: order.attributes?.username || 'Unknown',
          delivery_assignment: order.attributes?.delivery_assignment || 'Not Assigned',
          totalOrderAmount: order.attributes?.totalOrderAmount || 'Unknown',
          notes: order.attributes?.notes || 'None',
        }));
  
        const filteredOrders = mappedOrders.filter((order) =>
          order.delivery_assignment === userResponse.data.username 
        );
        setOrders(filteredOrders);
      } else {
        setErrorLog('No orders found or unexpected response structure');
      }
    } catch (error: any) {
      const errMsg = `Error fetching orders: ${error.response?.data?.message || error.message}`;
      setErrorLog(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered: Order[] = [];
    if (activeFilter === 'To Pick Up') {
      filtered = orders.filter(order => order.stat === 'Confirmed');
    } else if (activeFilter === 'Cancelled') {
      filtered = orders.filter(order => order.stat === 'Cancelled');
    } else if (activeFilter === 'Completed') {
      filtered = orders.filter(order => order.stat === 'Completed'); // Add Completed filter
    } else {
      filtered = orders.filter(order => order.stat === activeFilter);
    }
    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string | number, newStatus: 'To Ship' | 'Cancelled' | 'Delivered' | 'Completed') => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setErrorLog('No authentication token found. Please log in.');
      return;
    }

    try {
      const response = await axios.put(
        `https://deserving-action-5569f72002.strapiapp.com/api/orders/${orderId}`,
        { data: { status: newStatus } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        fetchOrders();
      } else {
        setErrorLog(`Failed to update order status. Response: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      const errMsg = `Error updating order status: ${error.response?.data?.message || error.message}`;
      setErrorLog(errMsg);
    }
  };

  const handleOrderUpdate = (orderId: number | string, newStatus: 'To Ship' | 'Cancelled' | 'Delivered' | 'Completed') => {
    updateOrderStatus(orderId, newStatus);
  };

  const updateOrderStatusWithProof = async (orderId: number | string, newStatus: string) =>  {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setErrorLog('No authentication token found. Please log in.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets) {
        const uploadedFiles = await uploadImageToStrapi(result.assets[0].uri, token);

        const response = await axios.put(
          `https://deserving-action-5569f72002.strapiapp.com/api/orders/${orderId}`,
          { data: { status: newStatus, delivery_proof: uploadedFiles[0].id } },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200 || response.status === 204) {
          fetchOrders();
        } else {
          setErrorLog(
            `Failed to update order status. Response: ${response.status} - ${response.statusText}`
          );
        }
      } else {
        Alert.alert('Image Upload', 'Image upload canceled.');
      }
    } catch (error: any) {
      const errMsg = `Error updating order status: ${
        error.response?.data?.message || error.message
      }`;
      setErrorLog(errMsg);
    }
  };

  const uploadImageToStrapi = async (imageUri: string, token: string) => {
    try {
      const formData = new FormData();
      const response = await fetch(imageUri);
      const blob = await response.blob();
  
      // Get the MIME type of the blob
      const mimeType = blob.type;
  
      // Validate that the MIME type is an image
      if (!mimeType.startsWith('image/')) {
        throw new Error('Invalid file type. Only image files are allowed.');
      }
  
      // Create a unique filename based on the mimeType (optional)
      const fileExtension = mimeType.split('/')[1];
      const fileName = `delivery_proof.${fileExtension}`;
  
      formData.append('files', new File([blob], fileName, { type: mimeType }));
  
      const uploadResponse = await axios.post(
        'https://deserving-action-5569f72002.strapiapp.com/api/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      return uploadResponse.data; // Return the uploaded file data
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Image upload failed.');
    }
  };
  

  // Function to determine background color based on status
  const getBackgroundColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return '#ffebcd'; // To Pick Up (light brown)
      case 'To Ship':
        return '#add8e6'; // To Ship (light blue)
      case 'Cancelled':
        return '#ffcccb'; // Cancelled (light red)
      case 'Delivered':
        return '#dfffd6'; // Delivered (light green)
      case 'Completed':
        return '#e6e6fa'; // Completed (light purple)
      default:
        return '#f0f0f0'; // Default color
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.orderContainer, { backgroundColor: getBackgroundColor(item.stat) }]}>
      <Text style={styles.orderText}>
        Order Number: <Text style={styles.boldText}>{item.paymentId.slice(0, 8)}</Text>
      </Text>
      <Text style={styles.orderText}>Total Amount: <Text style={styles.boldText}>₱{item.totalOrderAmount || 'Unknown'}</Text></Text>
      <Text style={styles.orderText}>Name: {item.username}</Text>
      <Text style={styles.orderText}>Address: {item.address || 'Unknown'}</Text>
      <Text style={styles.orderText}>Notes: {item.notes || 'Unknown'}</Text>
      <Text style={styles.orderText}>Phone: {item.phone || 'Unknown'}</Text>
      <Text style={styles.orderText}>Delivery Personnel: {item.delivery_assignment || 'Not Assigned'}</Text>

      {activeFilter === 'To Pick Up' && (
        <TouchableOpacity onPress={() => handleOrderUpdate(item.id, 'To Ship')} style={styles.actionButton}>
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Pick Up</Text>
        </TouchableOpacity>
      )}

{activeFilter === 'To Ship' && (
  <View style={styles.buttonContainer}>
    <TouchableOpacity
      onPress={() => updateOrderStatusWithProof(item.id, 'Delivered')}
      style={[styles.actionButton, styles.DeliveredButton]}
    >
      <Ionicons name="checkmark-done-outline" size={20} color="white" />
      <Text style={styles.actionButtonText}>Delivered</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => handleOrderUpdate(item.id, 'Cancelled')}
      style={[styles.actionButton, styles.cancelButton]}
    >
      <Ionicons name="close-circle-outline" size={20} color="white" />
      <Text style={styles.actionButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
)}

      {activeFilter === 'Completed' && (
        <View style={styles.buttonContainer}>
        </View>
      )}
    </View>
  );

  const handleFilterChange = (filter: 'To Pick Up' | 'To Ship' | 'Cancelled' | 'Delivered' | 'Completed') => {
    setActiveFilter(filter);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('./rscLong.png')}
        style={styles.logo}
      />
      <Text style={styles.username}>Welcome, {username}</Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => handleFilterChange('To Pick Up')}
          style={[styles.filterButton, activeFilter === 'To Pick Up' && styles.activeFilterButton]}
        >
          <Ionicons name="arrow-up-circle-outline" size={20} color="white" />
          <Text style={styles.filterButtonText}>To Pick Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilterChange('To Ship')}
          style={[styles.filterButton, activeFilter === 'To Ship' && styles.activeFilterButton]}
        >
          <Ionicons name="arrow-forward-circle-outline" size={20} color="white" />
          <Text style={styles.filterButtonText}>To Ship</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilterChange('Delivered')}
          style={[styles.filterButton, activeFilter === 'Delivered' && styles.activeFilterButton]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          <Text style={styles.filterButtonText}>Delivered</Text>
        </TouchableOpacity>  
        <TouchableOpacity
          onPress={() => handleFilterChange('Cancelled')}
          style={[styles.filterButton, activeFilter === 'Cancelled' && styles.activeFilterButton]}
        >
          <Ionicons name="close-circle-outline" size={20} color="white" />
          <Text style={styles.filterButtonText}>Cancelled</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilterChange('Completed')}
          style={[styles.filterButton, activeFilter === 'Completed' && styles.activeFilterButton]}
        >
          <Ionicons name="checkmark-done-circle-outline" size={20} color="white" />
          <Text style={styles.filterButtonText}>Completed</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={item => item.id.toString()}
        />
      )}

      {errorLog ? <Text style={styles.errorLog}>{errorLog}</Text> : null}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop:10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: '#4bb84b',
    borderRadius: 5,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#027d02',
  },
  filterButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  orderContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderText: {
    fontSize: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  DeliveredButton: {
    backgroundColor: '#28a745', // Green
  },
  cancelButton: {
    backgroundColor: '#dc3545', // Red
  },
  errorLog: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
  },
});

export default OrderStatus;
