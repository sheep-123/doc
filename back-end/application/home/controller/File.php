<?php

namespace app\home\controller;

use app\Admin\validate\User\user;
use think\Controller;
use think\Request;
use think\Db;

#[\AllowDynamicProperties]
class File extends Controller
{
  public function __construct()
  {
    parent::__construct();
    $this->FileModel = model('common/File/Index');
  }
  // 文件上传
  public function index()
  {

    if (isset($_FILES['file']) && $_FILES['file']['size'] > 0) {
      $name = $_FILES['file']['name'];
      $file = build_upload('file');
      if ($file['code'] === 0) {
        $this->error($file['msg']);
        exit;
      }
      $domain = request()->domain();
      $url = $domain . $file['data'];
      $where = [
        'file_path' => $url,
        'file_name' => $name,
        'status' => 1,
      ];
      $a = $this->FileModel->save($where);
      if ($a === false) {
        $this->error('插入文件路径失败');
      }

      $result = [
        'code' => 1,
        'msg' => '上传成功',
        'data' => [
          'url' => $url,
          'name' => $file['data'],
          'fileName' => $name,
          "id" => $this->FileModel->id
        ]
      ];

      echo json_encode($result);
      exit;
    } else {
      $result = [
        'code' => 0,
        'msg' => '上传失败',
        'data' => null
      ];
      echo json_encode($result);
      exit;
    }
  }
  // 获取文件列表
  public function filelist()
  {
    if ($this->request->isPost()) {
      $page = $this->request->param('page', 1, 'trim');
      $num=$this->request->param('num', 24, 'trim');
      $tag=$this->request->param('tag', '', 'trim');
      $keywords=$this->request->param('keywords', '', 'trim');
      $status=$this->request->param('status', 0, 'trim');
      $where=[];
      if($tag){
        $where['tag']=$tag;
      }
      if($keywords){
        $where['file_name']=['like','%'.$keywords.'%'];
      }
      if($status){
        $where['status']=$status;
      }
      
      $result = $this->FileModel
      ->where($where)
      ->order('id desc')
      ->page($page,$num)
      ->select();

      $count=$this->FileModel->where($where)->count();
      $data=[
        'count'=>$count,
        'data'=>$result
      ];
      if ($result) {
        $this->success('获取文件列表成功', null, $data);
        exit;
      } else {
        $this->error('暂无该文件');
        exit;
      }
    }
  }

  // 修改深度记忆状态
  public function memory()
  {
    if ($this->request->isPost()) {
      $id = $this->request->param('id', 0, 'trim');
      // var_dump($id);
      // exit;
      $result = $this->FileModel->where('id', $id)->update(['status' => 3]);
      if ($result) {
        $this->success('修改记忆状态成功');
        exit;
      } else {
        $this->error('修改记忆状态失败');
        exit;
      }
    }
  }

  // 编辑标签
  public function editTAg()
  {
    if($this->request->isPost()){
      $id = $this->request->param('id', 0, 'trim');
      $tag = $this->request->param('tag', '', 'trim');
      if(!$tag){
        $this->error('标签不能为空');
        exit;
      }
      $editResult = $this->FileModel->where('id', $id)->update(['tag' => $tag]);
      $where['tag'] = ['exp', Db::raw('is not null')];
      $result = $this->FileModel->where($where)->select();
      if ($result===false||$editResult===false) {
        $this->error('修改标签失败');
        exit;
      } else {
      
        $this->success('修改标签成功',null,$result);
        exit;
      }

    }
  }

  // 获取标签列表
  public function tagList()
  {
    if ($this->request->isPost()) {
      // tag字段不为空
      $where['tag'] = ['exp', Db::raw('is not null')];
      // 查找tag字段不为空的所有数据
      $result = $this->FileModel->where($where)->field("tag")->select();
      $result=array_unique($result);
      // 把key为tag的value值提取出来
      $result=array_column($result,'tag');
      // var_dump($result);
      // exit;
      $result=array_values($result);

      if ($result) {
        $this->success('获取标签列表成功', null, $result);
        exit;
      } else {
        $this->error('获取标签列表失败');
        exit;
      }
    }
 }

//  获取自动补全标签列表
public function querysearch(){
  if ($this->request->isPost()) {
  
    $result = $this->FileModel->field('file_name')->select();
    $arr = [];
    foreach ($result as $key => $value) {
          // 去除.pdf后缀
          $value['file_name'] = str_replace('.pdf', '', $value['file_name']);
          $arr[] = $value['file_name'];
    }
    // 去重
    $arr = array_unique($arr);
    // 重置数组索引
    $arr = array_values($arr);
    $this->success('获取自动补全标签列表成功', null, $arr);
    exit;

  }
}

// 获取域名
public function getDomain(){
  if ($this->request->isPost()) {
    $domain = request()->domain();
    if(!$domain){
      $this->error('获取域名失败');
      exit;
    }
    $domain = preg_replace('/^https?:\/\//', '', $domain);
    $domain="ws://".$domain.":2346";

    $this->success('获取域名成功', null, $domain);
    exit;
  }


}
}
