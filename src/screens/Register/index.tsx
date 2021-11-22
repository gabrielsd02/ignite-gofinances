import React, { useState, useEffect } from 'react';
import { 
    Keyboard, 
    Modal, 
    TouchableWithoutFeedback,
    Alert 
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {            
    Container,
    Header,
    Title, 
    Form,
    Fields,
    TransactionTypes
} from './styles';
import { Inputform } from '../../components/Form/InputForm';
import { Button } from '../../components/Form/Button';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';
import { CategorySelect } from '../CategorySelect';

interface FormData{
    name: string,
    amount: string
}

const schema = Yup.object().shape({
    name: Yup.string().required('Nome é obrigatório'),
    amount: Yup.number().typeError('Informe um valor numérico').positive('O valor não pode ser negativo').required('Preço é obrigatório')
})

const { v4: uuidv4 } = require('uuid');

export function Register() {

    const [ transactionType, setTransactionType ] = useState('');
    const [ categoryModalOpen, setCategoryModalOpen ] = useState(false);

    const [ category, setCategory ] = useState({
        key: 'category',
        name: 'Categoria'
    })

    const navigation = useNavigation();

    const dataKey = '@gofinances:transactions';

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema)
    });

    function handleTransactionTypeSelect(type: 'positive' | 'negative') {
        setTransactionType(type)
    }

    function handleCloseSelectCategory() {
        setCategoryModalOpen(false);
    }

    function handleModalOpenSelectCategory() {
        setCategoryModalOpen(true);
    }

    async function handleRegister(form : FormData) {

        if(!transactionType) {
            return Alert.alert('Selecione o tipo de transação');
        }

        if(category.key === 'category') {
            return Alert.alert('Selecione a categoria');
        }

        const newTransaction = {
            id: String(uuidv4()),
            name: form.name,
            amount: form.amount,
            type: transactionType,
            category: category.key,
            date: new Date()
        }
        
        try {

            const data = await AsyncStorage.getItem(dataKey); 
            const currentData = data ? JSON.parse(data) : [];

            // resgata os dados salvos no storage e add mais um
            const dataFormatted = [
                ...currentData,
                newTransaction
            ]
          
            // armazea no storage
            await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));

            // reseta
            reset();
            setTransactionType('');
            setCategory({
                key: 'category',
                name: 'Categoria'
            });

            navigation.navigate('Listagem');

        } catch(error) {
            console.log(error);
            Alert.alert("Não foi possível salvar");
        }

    }

    useEffect(() => {

        // carrega info do async storage
        async function loadData() {
            const data = await AsyncStorage.getItem(dataKey);
        } 

        // chama função
        loadData();

    }, [])

    return(
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Container> 
                <Header>
                    <Title>Cadastro</Title>
                </Header>
                <Form>
                    <Fields>
                        <Inputform 
                            name="name"
                            control={control}
                            placeholder={"Nome"}
                            autoCapitalize="sentences"
                            autoCorrect={false}
                            error={errors.name && errors.name.message}
                        />
                        <Inputform 
                            name="amount"
                            control={control}
                            placeholder={"Preço"}
                            keyboardType="numeric"
                            error={errors.amount && errors.amount.message}
                        />
                        <TransactionTypes>
                            <TransactionTypeButton 
                                type="up"
                                title="Income"
                                onPress={() => handleTransactionTypeSelect('positive')}
                                isActive={transactionType === 'positive'}
                            />
                            <TransactionTypeButton 
                                type="down"
                                title="Outcome"
                                onPress={() => handleTransactionTypeSelect('negative')}
                                isActive={transactionType === 'negative'}
                            />
                        </TransactionTypes>    
                        <CategorySelectButton 
                            title={category.name}
                            onPress={handleModalOpenSelectCategory}
                        />
                    </Fields>
                        <Button 
                            title="Enviar" 
                            onPress={handleSubmit(handleRegister)}
                        />
                </Form>
                <Modal visible={categoryModalOpen}>
                    <CategorySelect 
                        category={category}
                        setCategory={setCategory}
                        closeSelectCategory={handleCloseSelectCategory}
                    />
                </Modal>
            </Container>
        </TouchableWithoutFeedback>
    );
}