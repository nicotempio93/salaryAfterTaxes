

function calcular() {
    const horasTranajadas = parseFloat(document.getElementById("horasTrabajadas").value);
    const pagoPorHora = parseFloat(document.getElementById("pagoPorHora").value);
    
    console.log("Horas trabajadas:", horasTrabajadas);
    console.log("Pago por hora:", pagoPorHora);
    const radioSeleccionado = document.querySelector('input[name="tipoDeTax"]:checked').value;
    const salarioDespuesDeImpuesto = (horasTranajadas * pagoPorHora) * radioSeleccionado;
    
    console.log("Salario después de impuestos:", salarioDespuesDeImpuesto);
    document.getElementById("resultado").innerHTML = "You salary after taxes will be " + (salarioDespuesDeImpuesto.toFixed(2)) + "kr";
}

