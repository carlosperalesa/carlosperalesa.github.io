onRecordAfterCreate("messages", async (e) => {
    const msg = e.record;

    await $app.mailer.send({
        to: "carlosperalesa@gmail.com",
        subject: "Nuevo mensaje recibido en el portafolio",
        html: `
      <h2>Nuevo mensaje</h2>
      <p><strong>Nombre:</strong> ${msg.name}</p>
      <p><strong>Email:</strong> ${msg.email}</p>
      <p><strong>Teléfono:</strong> ${msg.phone}</p>
      <p><strong>Asunto:</strong> ${msg.subject}</p>
      <p><strong>Mensaje:</strong><br>${msg.message}</p>
    `
    });
});