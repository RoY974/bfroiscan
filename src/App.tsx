import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput, Row, Widget, EventObject} from 'tabris';
import {ImageView, Composite, fs, AlertDialog, CollectionView, WidgetPanEvent, app, Picker} from 'tabris';

const REPERTOIRE = fs.cacheDir + '/inv';
const NOMFIC = 'scan.csv';
const FICHIER = REPERTOIRE + '/' + NOMFIC;
let CDDEPOT = 'XX';
let CDAFFAIRE = 'NON PRECISE';

const items = [
  {icoda: 'CODE ART', ilib: 'LIBELLE', iqte: 'QUANTITE'},
];

const modefc = ['Normal', 'Inventaire'];

export class App {

  private bscan = new esbarcodescanner.BarcodeScannerView({
    id: 'BSCAN'
  })

  public start() {
    contentView.append(
      <$>
        <TabFolder paging stretch selectionIndex={0} tabBarLocation='bottom'>
          <Tab id='ACCUEIL' title='Accueil' onSelect={ev => this.tabScanHide(ev)}>
            <ImageView id='LOGO' centerX image='resources/logo.png' height={180} scaleMode='auto' onSwipeUp={this.wipFic}/>
            <Row id='LIG1' centerX bottom={195} spacing={10}>
              <Picker id='MODEFC' width={200} style='fill' message='Mode' itemCount={modefc.length} itemText={index => modefc[index]} selectionIndex={0}/>
            </Row>
            <Row id='LIG2' centerX bottom={135} spacing={10}>
              <TextInput id='CODDEPOT' width={200} style='fill' floatMessage={true} message='Code dépot' maxChars={2} autoCapitalize='all'/>
            </Row>
            <Row id='LIG3' centerX bottom={75} spacing={10}>
              <TextInput id='CODAFFAIRE' width={200} style='fill' floatMessage={true} message='Code affaire' maxChars={20} autoCapitalize='all'/>
            </Row>
            <Row id='LIG0' centerX bottom={5} spacing={10}>
              <Button id='BINIT' onSelect={this.fileInit}>Initialisation</Button>
              <Button id='RAZ' enabled={false} onSelect={this.rasedfichier}>Remise a zéro</Button>
            </Row>
            <TextView id='INFOFIC' centerX bottom={[Constraint.prev, 2]} font={{size: 15}}/>
          </Tab>
          <Tab id='SCAN' title='Scanner' visible={false} onResize={this.scanResize}>
            <TextView id='MARQSC' left={10} right={[Constraint.prev, 10]} background='black'>Camera</TextView>
            <Row id='LIGA' stretchX top={[Constraint.prev, 2]} height={25} spacing={5}>
              <TextView id='CODART' markupEnabled font={{size: 15}}><b>CODE ARTICLE</b></TextView>
              <TextView id='DESART' markupEnabled font={{size: 10}} stretchX>LIBELLE ARTICLE</TextView>
              <Button id='ENTMANU' width={30} font={{size: 10}} onSelect={this.Entreemanu}>+</Button>
            </Row>
            <Row id='LIGB' stretchX top={[Constraint.prev, 2]} height={45} spacing={10}>
              <Button id='BOUSCAN' onSelect={this.startScanner}>Scanner</Button>
              <TextInput id='COMPTE' stretchX padding={[5,2,2,5]} font={{size: 17}} onAccept={this.validScan} enterKeyType='done' keyboard='number' enabled={false}/>
              <Button id='ANNULER' onSelect={this.annulScan} enabled={false}>Annuler</Button>
            </Row>
            <Composite id='FAKEC' bottom={0} centerX width={20} height={70}/>
          </Tab>
          <Tab id='CONTENU' title='Contenu' visible={false} onSelect={ev => this.tabScanHide(ev)}>
            <CollectionView id='SCANLIST' stretchX top={2} bottom={50} cellHeight={64} itemCount={1} createCell={this.SLcreateCell} updateCell={SLupdateCell}/>
            <Button id='TERMINE' centerX top={[Constraint.prev, 2]} onSelect={this.goTermine}>Terminer</Button>
          </Tab>
        </TabFolder>
      </$>
    );
    $(TextInput).only('#COMPTE').height = $(Button).only('#BOUSCAN').height;
    this.bscan.scaleMode = 'fill';
    this.bscan.on('detect', (e) => this.aladetection(e));

    // Code qui gère si l'application est mis en arrière plan (touche home)
    app.onBackground(async () => {
      this.wipFic();
      await app.onResume.promise();
    });
  }

  private fileInit = () => {
    let validation = true;
    if ($(TextInput).only('#CODDEPOT').text === '') {
      validation = false;
      new AlertDialog({
        title: 'Le code depot doit être renseigné',
        buttons: {ok: 'OK'}
      }).open();
    }
    if ($(TextInput).only('#CODAFFAIRE').text === '') {
      validation = false;
      new AlertDialog({
        title: 'Le code affaire doit être renseigné',
        buttons: {ok: 'OK'}
      }).open();
    }
    
    if (validation) {
      //Enleve l'entete préconstruite par tabris de la collectionview
      items.shift();
      $(CollectionView).only('#SCANLIST').remove(0);
      try {
        if (fs.isFile(FICHIER)) {
          void fs.readFile(FICHIER, 'utf-8').catch(ex => console.error(ex)).then((ficlu) => {
            $(TextView).only('#INFOFIC').text = 'Fichier existant';
            this.recupfichier(ficlu).catch(ex => console.error(ex));
          });
        } else {
          CDDEPOT = $(TextInput).only('#CODDEPOT').text;
          CDAFFAIRE = $(TextInput).only('#CODAFFAIRE').text;
          fs.writeFile(FICHIER, CDDEPOT + ';' + CDAFFAIRE + ';QTE', 'utf-8').catch(ex => console.error(ex));
          $(CollectionView).only('#SCANLIST').itemCount = items.push({
            icoda: CDAFFAIRE,
            ilib: $(Picker).only('#MODEFC').itemText($(Picker).only('#MODEFC').selectionIndex),
            iqte: CDDEPOT});
          $(TextView).only('#INFOFIC').text = 'Fichier initialisé';
          $(Tab).only('#SCAN').visible = true;
          $(Button).only('#BINIT').enabled = false;
        }
      } catch (ex) {
        console.error(ex);
      }
    }
  }

  private async rasedfichier() {
    //Efface le fichier et réinitialise le contenu pour une prochaine série de scan
    void fs.removeFile(FICHIER).catch(ex => console.error(ex));
    //purge la liste d'item jusqu'à l'entête
    items.splice(1,items.length - 1);
    $(CollectionView).only('#SCANLIST').itemCount = items.length;
    $(Button).only('#BINIT').enabled = true;
    $(Button).only('#RAZ').enabled = false;
    $(TextInput).only('#CODDEPOT').text = "";
    $(TextInput).only('#CODAFFAIRE').text = "";
    $(TextView).only('#INFOFIC').text = 'Réinitialisation terminé';
  }

  private async recupfichier(ficlu: string | void) {
    //Si un fichier existe à l'initialisation, suppose que le tel a planté et propose de le reprendre
    const buttons = {ok: 'Oui', cancel: 'Non'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Recupérer fichier' buttons={buttons}>
        Un fichier précédent existe et a été détecté, voulez vous le reprendre ?
      </AlertDialog>
    );
    const {button} = await dialog.onClose.promise();
    if (button === 'ok') {
      if (typeof ficlu === 'string') {
        const ficluT = ficlu.split('\n');
        for (let i = 0; i < ficluT.length; i++) {
          const ligT = ficluT[i].split(';');
          if (ligT[0] !== 'CODE ART') {
            if (ligT[0] !== '') {
              $(CollectionView).only('#SCANLIST').itemCount = items.push({icoda: ligT[0], ilib: ligT[1], iqte: ligT[2]});
            }
          }
        }
      }
      $(TextInput).only('#CODDEPOT').text = items[0].iqte;
      CDDEPOT = items[0].iqte;
      $(TextInput).only('#CODAFFAIRE').text = items[0].icoda;
      CDAFFAIRE = items[0].icoda;
      $(Tab).only('#SCAN').visible = true;
      $(Tab).only('#CONTENU').visible = true;
      $(Button).only('#BINIT').enabled = false;
      $(Button).only('#RAZ').enabled = true;
    }
    else {
      console.log(`Annuler`);
    }
  }

  private wipFic = () => {
    //Normalement a des fins de debuggage
    void fs.removeFile(FICHIER).catch(ex => console.error(ex)).then(() => {
      $(TextView).only('#INFOFIC').text = 'Fichier supprimé';
    });
  }

  private scanResize = () => {
    //Principalement déclanché à l'apparission disparission du clavier
    $(TextView).only('#MARQSC').background = 'blue';
    $(TextView).only('#MARQSC').top = ['#SCAN', 2];
    $(TextView).only('#MARQSC').bottom = ['#FAKEC', 2];
    this.bscan.top = $(TextView).only('#MARQSC').top;
    this.bscan.bottom = $(TextView).only('#MARQSC').bottom;
    this.bscan.appendTo($(Tab).only('#SCAN'));
  }

  private tabScanHide(ev: EventObject<Widget>) {
    if (ev.target.id === 'CONTENU') {
      $(CollectionView).only('#SCANLIST').reveal(-1);
    }
    this.bscan.stop();
  }

  private startScanner = () => {
    //Prépare le champs recoltant le comptage
    $(TextInput).only('#COMPTE').enabled = true;
    $(TextInput).only('#COMPTE').focused = true;
    $(TextInput).only('#COMPTE').keepFocus = true;
    if (!this.bscan.active) { //initialise le scaner
      this.bscan.start(['qr']);
    }
  }

  private annulScan = () => {
    //Relance la recolte sans enregistrer le scan encours
    $(TextView).only('#CODART').text = "<b>CODE ARTICLE</b>";
    $(TextView).only('#DESART').text = "LIBELLE ARTICLE";
    $(Button).only('#ANNULER').enabled = false;
    $(TextInput).only('#COMPTE').text = "";
    $(Tab).only('#SCAN').background = 'white';
  }

  private aladetection(e: MessageEvent) { //quand une étiquette est lu par la caméra
    const decode = e.data.split('|');
    console.log(decode[4] + " " + decode[5]);
    if (!$(Button).only('#ANNULER').enabled) { //Evite des scans consécutif (par erreur)
      $(TextView).only('#CODART').text = "<b>" + decode[4] + "</b>";
      $(TextView).only('#DESART').text = decode[5];
      $(Button).only('#ANNULER').enabled = true;
      $(TextInput).only('#COMPTE').enabled = true;
      $(Tab).only('#SCAN').background = 'lime';
    }
  }

  private validScan = () => { //quand l'utilisateur valide le comptage
    if ($(TextInput).only('#COMPTE').text !== "") { //Ne fais rien s'il n'y a pas de chiffre d'entré
      let vart = $(TextView).only('#CODART').text;
      //epuration du code article du gras
      vart = vart.substring(3);
      vart = vart.substring(0, vart.length - 4);
      if (vart !== 'CODE ARTICLE') { //Ne fais rien si le scan n'a rien trouvé
        //rajoute un bout de libellé
        const vlib = $(TextView).only('#DESART').text.substring(0, 35);
        //rajoute la quantite compté
        const vqte = $(TextInput).only('#COMPTE').text;
        console.log(vart + ";" + vlib + ";" + vqte);
        if (!$(Tab).only('#CONTENU').visible) {
          $(Tab).only('#CONTENU').visible = true;
        }
        $(CollectionView).only('#SCANLIST').itemCount = items.push({icoda: vart, ilib: vlib, iqte: vqte})
        $(TextInput).only('#COMPTE').text = "";
        this.annulScan();
        if ((items.length % 2) === 0) {
          //Sauvegarde la liste tous les 2 scan
          goSave();
        }
        if (!$(Button).only('#RAZ').enabled) {
          $(Button).only('#RAZ').enabled = true;
        }
      }
    }
  }

  private async Entreemanu() {
    const buttons = {ok: 'Modifier', cancel: 'Fermer'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Entrée manuelle' buttons={buttons}>
        Entrer manuellement le code et un descriptif
        <TextInput message='Code article'/>
        <TextInput message='Libellé'/>
      </AlertDialog>
    );
    let entreesmanu: string[];
    let button: string;
    await dialog.onClose.promise().then((e) => {
      entreesmanu = e.texts;
      button = e.button;
      if (button === 'ok') {
        $(TextView).only('#CODART').text = "<b>" + entreesmanu[0] + "</b>";
        $(TextView).only('#DESART').text = entreesmanu[1];
      }
      else {
        console.log(`Annuler et revient au scan`);
      }
    });
  }

  private async goTermine() {
    //Une fois que l'opérateur fini son scan
    goSave();
    const buttons = {ok: 'Confirmer', cancel: 'Annuler'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Cloturer et envoyer' buttons={buttons}>
        Etes vous sur de terminer la saisie et envoyer le fichier ?
      </AlertDialog>
    );
    const {button} = await dialog.onClose.promise();
    if (button === 'ok') {
      console.log(`L'utilisateur confirme`);
      let exportitems : string;
      exportitems = "";
      //exportitems.shift();
      void fs.readFile(FICHIER, 'utf-8').then(data => {

        if ($(Picker).only('#MODEFC').selectionIndex === 0) {
        
          const ficluT = data.split('\n');
          for (let i = 1; i < ficluT.length; i++) {
            const ligT = ficluT[i].split(';');
            if (ligT[0] !== 'CODE ART') {
              if (ligT[0] !== '') {
                exportitems = exportitems + ligT[0] + ';' + ligT[2] + ';' + CDAFFAIRE + '\n';
              }
            }
          }
          console.log(exportitems);
          const file = new File([exportitems], CDDEPOT + CDAFFAIRE + '.csv', { type: 'text/csv' });
          app.share({title: 'scan terminé', text: 'CODE DEPOT : ' + CDDEPOT + ' ; CODE AFFAIRE : ' + CDAFFAIRE, files: [file]}).catch(ex => console.error(ex));
        }
        else {
          
          const ficluT = data.split('\n');
          for (let i = 0; i < ficluT.length; i++) {
            const ligT = ficluT[i].split(';');
            if (ligT[0] !== 'CODE ART') {
              if (ligT[0] !== '') {
                exportitems = exportitems + ligT[0] + ';' + ligT[1] + ';' + ligT[2] + '\n';
              }
            }
          }
          const file = new File([exportitems], 'INV_' + CDDEPOT + '.csv', { type: 'text/csv' });
          app.share({title: 'scan terminé', text: 'Inventaire du CODE DEPOT : ' + CDDEPOT, files: [file]}).catch(ex => console.error(ex));
          
        }
      }).catch(ex => console.error(ex));
    }
    else {
      console.log(`Annuler et revient à la saisie`);
    }
  }

  private SLcreateCell = () => {
    //Methode qui met en forme l'ajout d'une ligne de la CollectionView
    return (
      <Composite background='gray'>
        <Composite id='container' stretch background='white' onPanHorizontal={handlePan}>
          <TextView id='lscodeart' left={16} top={8} font='medium 16px'>codeart</TextView>
          <TextView id='lslibart' left={16} bottom={8}>libart</TextView>
          <TextView id='lsqteart' right={16} top={8} font='medium 16px'>qteart</TextView>
        </Composite>
        <Composite stretchX height={1} background='#eeeeee'/>
      </Composite>
    );
  }
}

function goSave() {
  //Fonction qui sauvegarde les scans dans le fichier
  let contenu = '';
  items.forEach((value) => {
    contenu = contenu + value.icoda + ';' + value.ilib + ';' + value.iqte + '\n';
  })
  console.log(contenu); //pour debuggage uniquement
  fs.writeFile(FICHIER, contenu, 'utf-8').catch(ex => console.error(ex));
}

function SLupdateCell(view: Composite, index: number) {
  //Fonction qui met à jour la ligne de scan avec le contenu scanné
  const item = items[index];
  const container = view.find('#container').only();
  container.data = item;
  container.transform = {translationX: 0};
  view.find(TextView).only('#lscodeart').text = item.icoda;
  view.find(TextView).only('#lslibart').text = item.ilib;
  view.find(TextView).only('#lsqteart').text = item.iqte;
}


//#region code qui gère l'animation de swip pour supprimer un scan
async function handlePan(event: WidgetPanEvent<Composite>) {
  const {target, state, translationX} = event;
  target.transform = {translationX};
  if (state === 'end') {
    await handlePanFinished(event);
  }
}

async function handlePanFinished({target, velocityX, translationX}: WidgetPanEvent<Composite>) {
  const beyondCenter = Math.abs(translationX) > target.bounds.width / 2;
  const fling = Math.abs(velocityX) > 200;
  const sameDirection = direction(velocityX) === direction(translationX);
  // When swiped beyond the center, trigger dismiss if flinged in the same direction or let go.
  // Otherwise, detect a dismiss only if flinged in the same direction.
  const dismiss = beyondCenter ? (sameDirection || !fling) : (sameDirection && fling);
  if (dismiss) {
    await animateDismiss(target, translationX);
  } else {
    await animateCancel(target);
  }
}

async function animateDismiss(target: Composite<Widget>, translationX: number) {
  await target.animate({
    transform: {translationX: direction(translationX) * target.bounds.width}
  }, {
    duration: 200,
    easing: 'ease-out'
  });
  const index = items.indexOf(target.data);
  items.splice(index, 1);
  $(CollectionView).only().remove(index);
}

async function animateCancel(target: Composite<Widget>) {
  return target.animate({transform: {translationX: 0}}, {duration: 200, easing: 'ease-out'});
}

function direction(offset: number) {
  return offset ? offset < 0 ? -1 : 1 : 0;
}
//#endregion

