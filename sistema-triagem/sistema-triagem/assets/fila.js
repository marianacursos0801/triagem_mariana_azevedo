class QueueController {
  constructor(state, dom, priorityLabels, priorityColor, callbacks) {
    this.state = state;
    this.dom = dom;
    this.priorityLabels = priorityLabels;
    this.priorityColor = priorityColor;
    this.callbacks = callbacks;
  }

  getPriorityValue(classification) {
    const priorityMap = {
      branco: 1,
      verde: 2,
      amarelo: 3,
      vermelho: 4
    };
    return priorityMap[classification] || 0;
  }

  getOrderedQueue() {
    return [...this.state.triages].sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b.classification) - this.getPriorityValue(a.classification);
      return priorityDiff !== 0 ? priorityDiff : 0;
    });
  }

  init() {
    this.dom.callNext.addEventListener("click", () => this.callNext());
  }

  callNext() {
    if (this.state.triages.length === 0) {
      return;
    }

    const orderedQueue = this.getOrderedQueue();
    const called = orderedQueue[0];

    if (!called) {
      return;
    }

    this.state.triages = this.state.triages.filter((item) => item.id !== called.id);
    const patient = this.state.patients.find((item) => item.id === called.patientId);
    this.state.patients = this.state.patients.filter((item) => item.id !== called.patientId);
    window.alert(`${patient ? this.state.getPatientName(patient) : "Paciente"} encaminhado para atendimento.`);
    this.state.save();
    this.callbacks.renderAll();
  }

  render() {
    if (this.state.triages.length === 0) {
      this.dom.queueBoard.innerHTML = `<div class="empty-state">Nenhum paciente aguardando atendimento.</div>`;
      return;
    }

    this.dom.queueBoard.innerHTML = this.getOrderedQueue().map((triage) => {
      const patient = this.state.patients.find((item) => item.id === triage.patientId);
      const patientName = patient ? this.state.getPatientName(patient) : "Paciente não encontrado";
      return `
        <article class="queue-card">
          <div class="risk-bar" style="background:${this.priorityColor[triage.classification]}"></div>
          <div class="queue-body">
            <header>
              <div>
                <strong>${patientName}</strong>
                <small>Entrada ${triage.time}</small>
              </div>
              <span class="tag ${triage.classification}">${this.priorityLabels[triage.classification]}</span>
            </header>
            <div class="tag-row">
              <span class="tag">PA ${triage.bloodPressure}</span>
              <span class="tag">Temp ${triage.temperature} °C</span>
              <span class="tag">SpO2 ${triage.oxygen}%</span>
            </div>
            <p class="meta-line">${triage.symptoms}</p>
          </div>
        </article>
      `;
    }).join("");
  }
}

window.QueueController = QueueController;
