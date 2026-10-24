class PatientRegistration {
  constructor(state, dom, callbacks) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
  }

  init() {
    this.dom.patientForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.patientForm.addEventListener("input", (event) => this.handleInput(event));
    this.dom.clearPatientForm.addEventListener("click", () => this.reset());
    this.dom.patientSearch.addEventListener("input", () => this.render());
    this.dom.patientList.addEventListener("click", (event) => this.handleListClick(event));
  }

  sanitizeText(value) {
    return String(value || "").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "").trim();
  }

  handleInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.name === "firstName" || input.name === "lastName") {
      input.value = this.sanitizeText(input.value);
      return;
    }

    if (input.id === "age" || input.id === "insuranceCard") {
      input.value = input.value.replace(/\D/g, "");
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(this.dom.patientForm);
    const firstName = this.sanitizeText(data.get("firstName"));
    const lastName = this.sanitizeText(data.get("lastName"));
    const age = String(data.get("age") || "").replace(/\D/g, "");
    const insuranceCard = String(data.get("insuranceCard") || "").replace(/\D/g, "");
    const patient = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      age,
      gender: data.get("gender"),
      address: data.get("address").trim(),
      insuranceName: data.get("insuranceName").trim(),
      insuranceCard,
      insuranceValidUntil: data.get("insuranceValidUntil"),
      insurancePlan: data.get("insurancePlan"),
      createdAt: new Date().toISOString()
    };
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(firstName) || !/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(lastName) || !patient.age || !patient.gender || !patient.address || !patient.insuranceName || !patient.insuranceCard) {
      this.callbacks.showMessage(this.dom.patientMessage, "Nome e sobrenome devem conter apenas letras e espaços.");
      return;
    }
    this.state.patients.push(patient);
    this.state.selectedPatientId = patient.id;
    this.state.save();
    this.reset();
    this.callbacks.showMessage(this.dom.patientMessage, "Paciente cadastrado.");
    this.callbacks.renderAll();
  }

  handleListClick(event) {
    const selectButton = event.target.closest("[data-select-patient]");
    const deleteButton = event.target.closest("[data-delete-patient]");
    if (selectButton) {
      this.state.selectedPatientId = selectButton.dataset.selectPatient;
      this.callbacks.setScreen("triagem");
      this.callbacks.renderAll();
    }
    if (deleteButton) {
      const index = Number(deleteButton.dataset.deletePatient);
      const removed = this.state.patients.splice(index, 1)[0];
      if (removed) {
        this.state.triages = this.state.triages.filter((triage) => triage.patientId !== removed.id);
      }
      this.state.save();
      this.callbacks.renderAll();
    }
  }

  reset() {
    this.dom.patientForm.reset();
  }

  render() {
    const search = this.dom.patientSearch.value.trim().toLowerCase();
    const triagedPatientIds = new Set(this.state.triages.map((triage) => triage.patientId));
    const patients = this.state.patients.filter((patient) => {
      if (triagedPatientIds.has(patient.id)) {
        return false;
      }
      const firstName = patient.firstName.toLowerCase();
      const lastName = patient.lastName.toLowerCase();
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return !search || firstName.includes(search) || lastName.includes(search) || fullName.includes(search);
    });
    if (patients.length === 0) {
      this.dom.patientList.innerHTML = `<div class="empty-state">Nenhum paciente na recepção.</div>`;
      return;
    }
    this.dom.patientList.innerHTML = patients.map((patient, index) => `
      <article class="patient-card">
        <header>
          <div>
            <strong>${this.state.getPatientName(patient)}</strong>
            <small>${patient.age} anos · ${patient.gender}</small>
          </div>
          <span class="tag">${patient.insurancePlan}</span>
        </header>
        <div class="meta-line">${patient.address}</div>
        <div class="meta-line">${patient.insuranceName} · ${patient.insuranceCard}</div>
        <div class="patient-actions">
          <button class="small-button" data-select-patient="${patient.id}" type="button">Triar</button>
          <button class="small-button danger-button" data-delete-patient="${index}" type="button">Remover</button>
        </div>
      </article>
    `).join("");
  }
}

window.PatientRegistration = PatientRegistration;
