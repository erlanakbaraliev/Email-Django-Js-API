document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadMailbox('inbox'); // Default load
});

// Event Listeners for Navigation
function setupNavigation() {
  const navigation = {
    '#inbox': () => loadMailbox('inbox'),
    '#sent': () => loadMailbox('sent'),
    '#archived': () => loadMailbox('archive'),
    '#compose': composeEmail
  };

  Object.entries(navigation).forEach(([selector, handler]) => {
    document.querySelector(selector).addEventListener('click', handler);
  });
}

// Compose Email
function composeEmail() {
  switchView('#compose-view');
  clearComposeFields();

  const sendButton = document.querySelector("#compose-view .btn");
  sendButton.onclick = sendEmail;
}

function sendEmail() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ recipients, subject, body })
  })
    .then(response => response.json())
    .then(status => console.log(status));
}

// Load Mailbox
function loadMailbox(mailbox) {
  switchView('#emails-view');
  displayMailboxTitle(mailbox);

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => renderMailbox(emails, mailbox));
}

// Load Individual Email
function loadEmail(email, mailbox) {
  switchView('#email-view');
  renderEmailDetails(email, mailbox);
  markAsRead(email.id);
}

// Helper Functions
function switchView(viewId) {
  ['#emails-view', '#email-view', '#compose-view'].forEach(id => {
    document.querySelector(id).style.display = id === viewId ? 'block' : 'none';
  });
}

function clearComposeFields() {
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function displayMailboxTitle(mailbox) {
  const title = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  document.querySelector('#emails-view').innerHTML = `<h3>${title}</h3>`;
}

function renderMailbox(emails, mailbox) {
  const emailsView = document.querySelector('#emails-view');
  emailsView.innerHTML = ''; // Clear previous content

  if (emails.length === 0) {
    emailsView.innerHTML += '<p>No emails to display.</p>';
    return;
  }

  emails.forEach(email => {
    const card = createMailboxCard(email, mailbox);
    emailsView.appendChild(card);
  });
}

function createMailboxCard(email, mailbox) {
  const card = document.createElement('div');
  card.className = `card ${email.read ? 'read' : 'unread'}`;
  card.addEventListener('click', () => {
    fetch(`/emails/${email.id}`)
      .then(response => response.json())
      .then(emailDetails => loadEmail(emailDetails, mailbox));
  });

  card.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">${email.sender}</h5>
      <p class="card-text">To: ${email.recipients}</p>
      <p class="card-text">Subject: ${email.subject}</p>
      <p class="card-text">Date: ${email.timestamp}</p>
    </div>
  `;

  return card;
}

function renderEmailDetails(email, mailbox) {
  const emailView = document.querySelector('#email-view');
  emailView.innerHTML = `
    <div class="card">
      <div class="card-body">
        <p class="card-text"><strong>To:</strong> ${email.recipients}</p>
        <p class="card-text"><strong>From:</strong> ${email.sender}</p>
        <p class="card-text"><strong>Subject:</strong> ${email.subject}</p>
        <p class="card-text"><strong>Timestamp:</strong> ${email.timestamp}</p>
        <p class="card-text"><strong>Body:</strong><br>${email.body.replace(/\n/g, '<br>')}</p>
        <button id="reply-button" class="btn btn-info">Reply</button>
        ${mailbox !== 'sent' ? createArchiveButton(email) : ''}
      </div>
    </div>
  `;

  document.querySelector("#reply-button").addEventListener('click', (event)=>{handleReply(email)})
}

function handleReply(email) {
  console.log("Reply")

  composeEmail()
  document.querySelector("#compose-recipients").value = email.sender
  document.querySelector("#compose-subject").value = `Re: ${email.subject}`
  document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote: \n${email.body}`
}

function createArchiveButton(email) {
  const buttonText = email.archived ? 'Unarchive' : 'Archive';
  return `
    <button class="btn btn-primary" onclick="toggleArchive(${email.id}, ${!email.archived})">
      ${buttonText}
    </button>
  `;
}

function markAsRead(emailId) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  });
}

function toggleArchive(emailId, archiveStatus) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({ archived: archiveStatus })
  }).then(() => {
    loadMailbox('inbox');
    alert(archiveStatus ? 'Email archived!' : 'Email unarchived!');
  });
}
