export class Customer {
    constructor({id = null, dpi, firstName, lastName, email, phone, active = true}){
        this.id = id;
        this.dpi = this.validateDpi(dpi);
        this.firstName = this.validateRequire(firstName, 'Nombre');
        this.lastName = this.Required(lastName, 'Apellido');
        this.email = this.validateEmail(email);
        this.phone = phone;
        this.active = active;
    }
validateRequire(value, fieldName){
    if(!value || typeof value !== 'string' || value.trim() === ''){
        throw new Error(`El campo ${fieldName} es obligatorio.`);

    }
    return value.trim();
}
validateEmail(email) {
    const cleanEmail = email ? email.trim() : '';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/;
    
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        throw new Error('Correo electrónico con formato no válido.');
    }
    
    return cleanEmail.toLowerCase();
}

validateDpi(dpi){
    if(!dpi || dpi.length < 8){
        throw new Error('El numero de dpi debe contener al menos 8 caracteres.');

    }
    return dpi.trim();
}
}

