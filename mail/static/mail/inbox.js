document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector("#compose-view .btn").addEventListener('click', ()=>{
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        "recipients": recipients,
        "subject": subject,
        "body": body
      })
    })
    .then(response => response.json())
    .then(status => console.log(status))
  })
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  get_mailbox(mailbox)
}

function load_mail(emailJson, mailbox) {
  document.querySelector('#email-view').style.display = 'block'
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  create_mail_card(emailJson, mailbox)
  mark_read(emailJson)
}

function get_mailbox(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    if(emails[0] && Object.keys(emails[0]).length > 0) {
      for(const email of emails) {
        create_mailbox_card(email, mailbox)
      }
    }
  })
}

function create_mailbox_card(email, mailbox) {
  const emails_view = document.querySelector("#emails-view")
  
  const mailboxDiv = document.createElement('div')
  if(email['read']) {
    mailboxDiv.className = "card read"
  }
  else {
    mailboxDiv.className = "card notRsead"
  }
  mailboxDiv.addEventListener('click', function(event){
    fetch(`/emails/${email['id']}`)
    .then(response => response.json())
    .then(emailJson => {
      load_mail(emailJson, mailbox)
    })
  })
  
  const card_body = document.createElement("div")
  card_body.className = "card-body"
  
  const card_title = document.createElement("h5")
  card_title.className = "card-title"
  card_title.textContent = email['sender']

  const card_text_recipients = document.createElement('p')
  card_text_recipients.className = "card-text"
  card_text_recipients.textContent = `To: ${email['recipients']}`
  
  const card_text_subject = document.createElement('p')
  card_text_subject.className = "card-text"
  card_text_subject.textContent = `Subject: ${email['subject']}`

  const card_text_time = document.createElement('p')
  card_text_time.className = "card-text"
  card_text_time.textContent = `Date: ${email['timestamp']}`
  
  
  card_body.append(card_title, card_text_recipients, card_text_subject, card_text_time)
  mailboxDiv.append(card_body)
  emails_view.appendChild(mailboxDiv)
}

function create_mail_card(emailJson, mailbox) {
  const mailCard = document.createElement('div')
  mailCard.className = "card"

  const email_view = document.querySelector("#email-view")
  email_view.textContent = ""
  
  const card_body = document.createElement("div")
  card_body.className = "card-body"

  const card_text_to = document.createElement('p')
  card_text_to.className = "card-text"
  card_text_to.innerHTML = `<strong>To:</strong> ${emailJson['recipients']}`

  const card_text_from = document.createElement('p')
  card_text_from.className = "card-text"
  card_text_from.innerHTML = `<strong>From:</strong> ${emailJson['sender']}`
  
  const card_text_subject = document.createElement('p')
  card_text_subject.className = "card-text"
  card_text_subject.innerHTML = `<strong>Subject:</strong> ${emailJson['subject']}`

  const card_text_timestamp = document.createElement('p')
  card_text_timestamp.className = "card-text"
  card_text_timestamp.innerHTML = `<strong>Timestamp:</strong> ${emailJson['timestamp']}`
  
  const card_text_body = document.createElement('p');
  card_text_body.className = "card-text";
  
  const formattedBody = emailJson['body'].replace(/\n/g, '<br>');
  
  card_text_body.innerHTML = `<strong>Body:</strong> <br>${formattedBody}`;
  
  const card_reply = document.createElement("button")
  card_reply.className = "btn btn-info"
  card_reply.type = "button"
  card_reply.textContent = "Reply"

  card_reply.addEventListener('click', (event)=>{
    console.log("Reply")
  })

  const card_archive = document.createElement("button")
  if(mailbox !== 'sent') {
    card_archive.className = "btn btn-primary"
    card_archive.type = "button"

    if(emailJson['archived']) {
      card_archive.textContent = "Unarchive"
    
      card_archive.addEventListener('click', (event)=>{
        archive(emailJson['id'], false)
      })
    }
    else {
      card_archive.textContent = "Archive"
    
      card_archive.addEventListener('click', (event)=>{
        archive(emailJson['id'], true)
      })
    }

    card_body.append(card_text_from, card_text_to, card_text_subject, card_text_timestamp, card_text_body, card_reply, card_archive)
  }
  else {
    card_body.append(card_text_from, card_text_to, card_text_subject, card_text_timestamp, card_text_body, card_reply)
  }

  mailCard.appendChild(card_body)
  email_view.appendChild(mailCard)
}

function mark_read(emailJson) {
  fetch(`/emails/${emailJson['id']}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function archive(id, archived) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archived
    })
  })
  .then(()=>{
    if(archived) {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-success alert-dismissible fade show';
      alertDiv.role = 'alert';

      const strongText = document.createElement('strong');
      strongText.textContent = 'Successfully archived!';
  
      alertDiv.appendChild(strongText);
      document.querySelector("#email-view").appendChild(alertDiv)
    }
    else {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-success alert-dismissible fade show';
      alertDiv.role = 'alert';

      const strongText = document.createElement('strong');
      strongText.textContent = 'Successfully unarchived!';
  
      alertDiv.appendChild(strongText);
      document.querySelector("#email-view").appendChild(alertDiv)
    }
  })
}