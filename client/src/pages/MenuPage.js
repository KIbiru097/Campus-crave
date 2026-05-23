import React from 'react';
import { useParams } from 'react-router-dom';
import MenuItems from '../components/MenuItems';

const MenuPage = () => {
    const { cafeId } = useParams();
    
    return (
        <div>
            <MenuItems cafeId={cafeId} />
        </div>
    );
};

export default MenuPage;