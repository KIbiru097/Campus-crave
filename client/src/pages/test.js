import client from '../apollo-client';
import { gql } from '@apollo/client';

export default function TestPage({ cafes }) {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Backend Connection Test</h1>
      <h2>Connected to: https://campus-crave-1.onrender.com</h2>
      <pre>{JSON.stringify(cafes, null, 2)}</pre>
    </div>
  );
}

export async function getStaticProps() {
  try {
    const { data } = await client.query({
      query: gql`
        query GetCafes {
          cafes {
            id
            name
            location
          }
        }
      `
    });
    
    return {
      props: { cafes: data.cafes }
    };
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return {
      props: { cafes: [], error: error.message }
    };
  }
}
